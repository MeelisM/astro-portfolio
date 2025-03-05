# 🚀 Asto Portfolio Website

This repository contains the source code for my Astro + Tailwind CSS portfolio website. It is deployed as a static site on AWS using S3, Cloudfront, and Cloudflare for DNS management. Infrastructure provisioning is handled with Terraform and CI/CD is powered by GitHub Actions.

## 📌 Features

    - 🚀 Astro + Tailwind CSS for a modern, performant static site.
    - 🔒 AWS S3 & CloudFront for secure, fast global content delivery.
    - 🌍 Cloudflare DNS for domain management.
    - 📦 Terraform to provision AWS infrastructure.
    - ⚡ CI/CD using GitHub Actions for automated deployment.
    - 🎨 Accessible & responsive design with interactive elements.

## 📂 Project Structure

```
📦 astro-portfolio
├── 📁 .github/workflows    # CI/CD GitHub Actions workflows
├── 📁 src                  # Astro components & pages
├── 📁 public               # Static assets (e.g. favicon, fonts)
├── 📁 terraform            # Terraform scripts & variables for AWS & Cloudflare
├── 📄 package.json         # Astro project dependencies
└── 📄 README.md            # This documentation
```

## 🚀 Getting Started

### 1️⃣ Prerequisites

Ensure you have the following installed:

    - Node.js (for Astro development)
    - Terraform (for infrastructure)
    - AWS CLI (configured with appropriate IAM persmissions)
    - Cloudflare API token (for DNS management)

### 2️⃣ Local Development

Clone the repository:

```
git clone https://github.com/MeelisM/astro-portfolio.git
cd astro-portfolio
```

Install dependencies:

```
npm install
```

Start the development server:

```
npm run dev
```

### 🛠 Development Commands

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Starts the local development server at `localhost:4321`. |
| `npm run build`   | Builds the project for production (`dist/` folder).      |
| `npm run preview` | Serves the built project locally for testing.            |
| `npm run lint`    | Runs ESLint to check for code issues.                    |

## 🌍 Deployment

### 1️⃣ Infrastrucure Setup (Terraform)

Note: Ensure `terraform/terraform.fvars` is configured before running Terraform.

Initialize Terraform:

```
cd terraform
terraform init
```

Plan and apply Terraform changes:

```
terraform plan
terraform apply
```

This will provision:

- An S3 bucket
- A Cloudfront distribution (with S3 as origin)
- A Cloudflare DNS record pointing to CloudFront.

### 2️⃣ Deploying Website

This project uses GitHub Actions for deployment. Pushing changes to the `main` branch will trigger the deployment workflow.

- Commit and push changes

```
git add .
git commit -m "Update portfolio"
git push origin main
```

The GitHub Actions CI/CD workflow will:

- Lint the project code.
- Build the Astro site.
- Sync files to S3.
- Invalidate the Cloudfront cache.

## 🛠️ Configuration

Terraform Variables (stored in `terraform/terraform.tfvars`, not commited. You can find the variable examples in `terraform/terraform.tfvars.example`.)

```text
aws_access_key = ""                         # Your AWS Access Key
aws_secret_key = ""                         # Your AWS Secret Key
cloudflare_secret_token = ""                # Cloudflare Secret Token
cloudflare_zone_id = ""                     # Cloudflare Zone ID for your domain
aws_account_id = ""                         # AWS Account ID
domain_name = "yourwebsite.com"             # Your Cloudflare root domain (@)
subdomain_name = "www.yourwebsite.com"      # Your Cloudflare domain (www)
aws_region_main = ""                        # AWS Region of your bucket
website_bucket_name = ""                    # S3 bucket name
github_username = ""                        # Your GitHub username
github_repository_name = ""                 # Your GitHub repository name
```

## 📜 License

This project is licensed under the [MIT License](/LICENSE).
