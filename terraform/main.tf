# ---------------------
# OIDC Identity Provider for GitHub Actions
# ---------------------
resource "aws_iam_openid_connect_provider" "github_oidc" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

# ---------------------
# IAM Role for GitHub Actions (OIDC Authentication)
# ---------------------
resource "aws_iam_role" "github_actions_role" {
  name = "github-actions-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRoleWithWebIdentity"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_oidc.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" : "sts.amazonaws.com"
          },
          StringLike = {
            "token.actions.githubusercontent.com:sub" : [
              "repo:${var.github_username}/${var.github_repository_name}:ref:refs/heads/main"
            ]
          }
        }
      }
    ]
  })
  depends_on = [aws_iam_openid_connect_provider.github_oidc]
}

data "aws_caller_identity" "current" {}

resource "aws_iam_policy" "custom_s3_policy" {
  name        = "github-actions-s3-policy"
  description = "Allow GitHub Actions to interact with specific S3 bucket for website"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutBucketWebsite",
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          aws_s3_bucket.website_bucket.arn,
          "${aws_s3_bucket.website_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.website_distribution.id}"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "role_policy_attachment" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.custom_s3_policy.arn
}

# ---------------------
# S3 Bucket for Static Website
# ---------------------
resource "aws_s3_bucket" "website_bucket" {
  bucket = var.website_bucket_name
}

resource "aws_s3_bucket_public_access_block" "website_bucket_public_access_block" {
  bucket                  = aws_s3_bucket.website_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------------------
# CloudFront Origin Access Control
# ---------------------
resource "aws_cloudfront_origin_access_control" "website_oac" {
  name                              = "${var.subdomain_name}-oac"
  description                       = "OAC for ${var.subdomain_name} S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ---------------------
# S3 Bucket Policy for CloudFront OAC
# ---------------------
resource "aws_s3_bucket_policy" "cloudfront_access_policy" {
  bucket = aws_s3_bucket.website_bucket.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly",
        Effect = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action   = "s3:GetObject",
        Resource = "${aws_s3_bucket.website_bucket.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.website_distribution.id}"
          }
        }
      }
    ]
  })
  depends_on = [aws_cloudfront_distribution.website_distribution]
}

# ---------------------
# SSL Certificate & Cloudflare DNS Validation
# ---------------------
resource "aws_acm_certificate" "website_certificate" {
  provider          = aws.us_east_1
  domain_name       = var.subdomain_name
  validation_method = "DNS"
  subject_alternative_names = [
    var.domain_name,
    var.subdomain_name
  ]
}

resource "cloudflare_record" "acm_validation" {
  for_each = { for dvo in aws_acm_certificate.website_certificate.domain_validation_options : dvo.domain_name => dvo }

  zone_id = var.cloudflare_zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  content = each.value.resource_record_value
  ttl     = 300
}

resource "aws_acm_certificate_validation" "cert" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.website_certificate.arn

  validation_record_fqdns = [for record in cloudflare_record.acm_validation : record.hostname]
}

# ---------------------
# CloudFront Distribution
# ---------------------
resource "aws_cloudfront_response_headers_policy" "csp_policy" {
  name = "CSPPolicy"

  security_headers_config {
    content_security_policy {
      override                = true
      content_security_policy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
    }
  }
}

resource "aws_cloudfront_distribution" "website_distribution" {
  depends_on = [aws_acm_certificate_validation.cert]

  origin {
    domain_name              = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_id                = "S3-${var.subdomain_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.website_oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.subdomain_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 31536000
    max_ttl                = 31536000

    response_headers_policy_id = aws_cloudfront_response_headers_policy.csp_policy.id
  }

  aliases = [
    var.domain_name,
    var.subdomain_name
  ]

  price_class = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.website_certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  wait_for_deployment = false
}

# ---------------------
# Cloudflare DNS for CloudFront
# ---------------------
resource "cloudflare_record" "cloudfront_www" {
  depends_on = [aws_cloudfront_distribution.website_distribution]

  zone_id = var.cloudflare_zone_id
  name    = "www"
  type    = "CNAME"
  content = aws_cloudfront_distribution.website_distribution.domain_name
  ttl     = 1
  proxied = true
}

resource "cloudflare_record" "cloudfront_root" {
  depends_on = [aws_cloudfront_distribution.website_distribution]

  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "CNAME"
  content = aws_cloudfront_distribution.website_distribution.domain_name
  ttl     = 1
  proxied = true
}
