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
  depends_on = [
    aws_acm_certificate_validation.cert,
    aws_s3_bucket.website_bucket
  ]

  origin {
    domain_name              = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_id                = var.subdomain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.website_oac.id
  }

  origin {
    domain_name = replace(aws_apigatewayv2_api.visitor_counter_api.api_endpoint, "https://", "")
    origin_id   = "ApiGateway-${var.subdomain_name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "x-api-secret"
      value = var.api_secret_header
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 403
    response_page_path = "/403.html"
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = var.subdomain_name

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

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ApiGateway-${var.subdomain_name}"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 60
    default_ttl            = 60
    max_ttl                = 60
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewriter.arn
    }
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


# ---------------------
# DynamoDB Table for Visitor Counter
# ---------------------
resource "aws_dynamodb_table" "visitor_counter" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "Visitor Counter Table"
  }
}

resource "aws_dynamodb_table_item" "counter_seed" {
  table_name = aws_dynamodb_table.visitor_counter.name
  hash_key   = aws_dynamodb_table.visitor_counter.hash_key

  item = <<ITEM
{
  "id": {"S": "visitors"},
  "count": {"N": "0"}
}
ITEM

  lifecycle {
    ignore_changes = [item]
  }
}

# ---------------------
# Lambda Function for Visitor Counter
# ---------------------
resource "aws_lambda_function" "visitor_counter" {
  function_name = "s3website-visitor-counter"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"

  filename         = "${path.module}/lambda_function.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_function.zip")

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.visitor_counter.name
      API_SECRET_HEADER = var.api_secret_header
    }
  }
}

# ---------------------
# Lambda Execution Role
# ---------------------
resource "aws_iam_role" "lambda_execution_role" {
  name = "s3website-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# ---------------------
# Lambda Permission for DynamoDB
# ---------------------
resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name        = "${var.subdomain_name}-lambda-dynamodb-policy"
  description = "Allow Lambda to interact with DynamoDB for visitor counter"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.visitor_counter.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        "Resource" : "arn:aws:logs:${var.aws_region_main}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${aws_lambda_function.visitor_counter.function_name}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
}

# ---------------------
# API Gateway
# ---------------------
resource "aws_apigatewayv2_api" "visitor_counter_api" {
  name          = "${var.subdomain_name}-visitor-counter-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins  = ["https://${var.domain_name}", "https://${var.subdomain_name}"]
    allow_methods  = ["GET", "OPTIONS"]
    allow_headers  = ["Content-Type", "Cache-Control"]
    expose_headers = ["Cache-Control"]
  }
}

resource "aws_apigatewayv2_stage" "visitor_counter_stage" {
  api_id      = aws_apigatewayv2_api.visitor_counter_api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_rate_limit  = 2
    throttling_burst_limit = 4
  }
}

resource "aws_apigatewayv2_integration" "visitor_counter_integration" {
  api_id             = aws_apigatewayv2_api.visitor_counter_api.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.visitor_counter.invoke_arn
}

resource "aws_apigatewayv2_route" "visitor_counter_route" {
  api_id    = aws_apigatewayv2_api.visitor_counter_api.id
  route_key = "GET /count"
  target    = "integrations/${aws_apigatewayv2_integration.visitor_counter_integration.id}"
}

# ---------------------
# Lambda Permission for API Gateway
# ---------------------
resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.visitor_counter.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.visitor_counter_api.execution_arn}/*/*/count"
}

# ---------------------
# URL Rewrite Function for API Gateway
# ---------------------
resource "aws_cloudfront_function" "url_rewriter" {
  name    = "s3website-url-rewriter"
  runtime = "cloudfront-js-1.0"
  code    = <<-EOT
    function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.startsWith('/api')) {
    request.uri = uri.replace(/^\/api/, '');
  }

  return request;
}
  EOT
}

# ---------------------
# CloudWatch Alarm for Visitor Counter
# ---------------------
resource "aws_cloudwatch_metric_alarm" "api_count_alarm" {
  alarm_name          = "visitor-counter-api-high-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Count"
  namespace           = "AWS/ApiGateway"
  period              = "3600"
  statistic           = "Sum"
  threshold           = "1000"
  alarm_description   = "Alarm when visitor counter API exceeds 1000 requests per hour"
  dimensions          = { ApiId = aws_apigatewayv2_api.visitor_counter_api.id }
}

# ---------------------
# AWS Budget
# ---------------------
resource "aws_budgets_budget" "api_count_budget" {
  name         = "api-gateway-budget"
  budget_type  = "COST"
  limit_amount = "10"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "Service"
    values = ["Amazon API Gateway"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_notification_email]
  }
}
