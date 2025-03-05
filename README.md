# 🚀 Asto Portfolio Website

This repository contains the source code for my Astro + Tailwind CSS portfolio website. It is deployed as a static site on AWS using S3, CloudFront, and Cloudflare for DNS management. Infrastructure provisioning is handled with Terraform and CI/CD is powered by GitHub Actions.

![Website Preview](/.github/assets/website.png)

## 📌 Features

- 🚀 **Astro + Tailwind CSS** for a modern, performant static site.
- 🔒 **AWS S3 & CloudFront** for secure, fast global content delivery.
- 🌍 **Cloudflare DNS** for domain management.
- 📦 **Terraform** to provision AWS infrastructure.
- ⚡ **CI/CD** using GitHub Actions for automated deployment.
- 🎨 **Accessible & responsive** design with interactive elements.

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

Tested on:

- Node.js 22+ (for Astro development).
- Terraform v1.11.0+ (for infrastructure).
- AWS CLI (configured with appropriate IAM permissions).
- Cloudflare API token (for DNS management).

### 2️⃣ Local Development

Clone the repository:

```bash
git clone https://github.com/MeelisM/astro-portfolio.git
cd astro-portfolio
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Your site will be available at [http://localhost:4321](http://localhost:4321)

### 🛠 Development Commands

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Starts the local development server at `localhost:4321`. |
| `npm run build`   | Builds the project for production (`dist/` folder).      |
| `npm run preview` | Serves the built project locally for testing.            |
| `npm run lint`    | Runs ESLint to check for code issues.                    |

## 🌍 Deployment

### 1️⃣ Deploying to GitHub Pages or Cloudflare Pages

You can deploy the site directly to **GitHub Pages** or **CloudFlare Pages** without needing to set up AWS or Terraform.

#### GitHub Pages

Ensure the project is ready to be deployed by running the build command:

```bash
npm run build
```

Push the `dist`folder to your repository's `gh-pages`branch (if not already set up).

```bash
git subtree push --prefix dist origin gh-pages
```

Your site should now be available at `https://<your-username>.github.io/<your-repository-name>`

#### Cloudflare Pages

- Go to Cloudflare Pages and create a new project.
- Connect your GitHub repository.
- For **Build Command**, use:

```bash
npm run build
```

- Set the Built Output Directory to `dist`.
- Click `Deploy` to publish your site!

### 2️⃣ Infrastructure Setup (Terraform)

Note: Ensure `terraform/terraform.tfvars` is configured before running Terraform.

Initialize Terraform:

```bash
cd terraform
terraform init
```

Plan and apply Terraform changes:

```bash
terraform plan
terraform apply
```

This will provision:

- An S3 bucket.
- A Cloudfront distribution (with S3 as origin).
- A Cloudflare DNS record pointing to CloudFront.

### 2️⃣ Deploying Website

This project uses GitHub Actions for deployment. Pushing changes to the `main` branch will trigger the deployment workflow.

Commit and push changes:

```bash
git add .
git commit -m "Update portfolio"
git push origin main
```

The GitHub Actions CI/CD workflow will:

- ✅ Lint the project code.
- 🔨 Build the Astro site.
- 📦 Sync files to S3.
- 🚀 Invalidate the Cloudfront cache.

## 🛠️ Configuration

Terraform Variables (stored in `terraform/terraform.tfvars`, not committed. You can find the variable examples in `terraform/terraform.tfvars.example`.)

### **Terraform Variables**

| Variable Name             | Description                        |
| ------------------------- | ---------------------------------- |
| `aws_access_key`          | Your AWS Access Key                |
| `aws_secret_key`          | Your AWS Secret Key                |
| `cloudflare_secret_token` | Cloudflare Secret Token            |
| `cloudflare_zone_id`      | Cloudflare Zone ID for your domain |
| `aws_account_id`          | AWS Account ID                     |
| `domain_name`             | Your Cloudflare root domain (`@`)  |
| `subdomain_name`          | Your Cloudflare subdomain (`www`)  |
| `aws_region_main`         | AWS Region of your bucket          |
| `website_bucket_name`     | S3 bucket name                     |
| `github_username`         | Your GitHub username               |
| `github_repository_name`  | Your GitHub repository name        |

---

### **GitHub Actions Secrets**

| Secret Name                  | Description                |
| ---------------------------- | -------------------------- |
| `AWS_ACCOUNT_ID`             | Your AWS Account ID        |
| `AWS_REGION`                 | AWS Region of your bucket  |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront Distribution ID |
| `S3_BUCKET_NAME`             | S3 bucket name             |

## 📜 License

This project is licensed under the [MIT License](/LICENSE).
