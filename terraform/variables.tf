variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "cloudflare_secret_token" {
  description = "Cloudflare Secret Access Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the domain"
  type        = string
}

variable "aws_account_id" {
  description = "The AWS account ID"
  type        = string
}

variable "domain_name" {
  description = "The root domain for the website (@)"
  type        = string
}

variable "subdomain_name" {
  description = "The subdomain for the website (www)"
  type        = string
}

variable "aws_region_main" {
  description = "The main AWS region for the website"
  type        = string
}

variable "website_bucket_name" {
  description = "The name of the S3 bucket for the website"
  type        = string
}

variable "github_username" {
  description = "Your GitHub username"
  type        = string
}

variable "github_repository_name" {
  description = "Your GitHub repository name"
  type        = string
}

variable "budget_notification_email" {
  description = "The email address to send budget alerts to"
  type        = string
}

variable "dynamodb_table_name" {
  description = "The name of the DynamoDB table for visitor count"
  type        = string
}

variable "api_secret_header" {
  description = "The secret header for the API Gateway"
  type        = string
}
