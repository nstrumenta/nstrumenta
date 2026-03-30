# Terraform

Infrastructure-as-code for provisioning nstrumenta deployments.

## Architecture

**Fully serverless with $0 fixed monthly costs when not in use:**

- **Firebase Project**: Firestore database, Cloud Storage, Firebase Auth
- **Cloud Run**: Serves both backend API and frontend static files
- **Firebase Hosting**: CDN for frontend with custom domain support
- **Cloud Functions**: Storage triggers for Firestore metadata
- **Secret Manager**: API key pepper storage
- **Artifact Registry**: Container image storage for CI builds
- **Workload Identity Federation**: Keyless GitHub Actions authentication

## Workspaces

```shell
terraform workspace list
terraform workspace select <name>
```

## Setup

```shell
cd terraform
terraform init
terraform workspace new <workspace-name>
```

Set variables in Terraform Cloud (org: `nstrumenta`):
- `billing_account`: GCP billing account ID
- `org_id`: GCP organization ID
- `GITHUB_CLIENT_ID`: GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth App Client Secret (sensitive)
- `support_email`: Email for OAuth consent screen
- `custom_domain`: Domain for this workspace (e.g. `nstrumenta.com`, `ci-nst.nstrumenta.com`)
- `enable_www_redirect`: Set `true` for apex domains that need `www.` redirect (prod only)

## DNS

Each workspace's `custom_domain` needs a CNAME record configured in the domain registrar. The required CNAME value is shown in the Firebase Hosting console after `terraform apply` creates the custom domain resource.

## Deploy

```shell
terraform plan
terraform apply
```

## Continuous Delivery

On merge to main, GitHub Actions automatically:
1. Builds and tests all packages
2. Pushes Docker images to Artifact Registry
3. Deploys frontend and server to both CI and prod environments

On pull requests:
1. Deploys an ephemeral preview environment (Firebase Hosting channel + Cloud Run service)
2. Comments the preview URL on the PR
3. Cleans up on PR close

## Authentication

All services use Application Default Credentials (ADC). No service account keys are provisioned or stored. GitHub Actions authenticates via Workload Identity Federation (keyless).

## Outputs

```shell
terraform output project_id
terraform output domain
terraform output cloud_run_url
terraform output nstrumenta_version
terraform output workload_identity_provider
terraform output service_account_email
```

## Development

The remote backend runs in HCP Terraform. Authentication uses the `TF_TOKEN_app_terraform_io` environment variable (set in the dev container via `credentials/activate.sh`). No `terraform login` or credentials file is needed.

Workspace variables are managed in the HCP Terraform UI or via the API:

```shell
# Set a variable on a workspace via API
curl -s -X PATCH \
  -H "Authorization: Bearer $TF_TOKEN_app_terraform_io" \
  -H "Content-Type: application/vnd.api+json" \
  "https://app.terraform.io/api/v2/vars/$VAR_ID" \
  -d '{"data":{"attributes":{"value":"new-value"}}}'
```

Variables can also be passed directly on plan/apply:

```shell
terraform plan -var="custom_domain=example.nstrumenta.com"
```
