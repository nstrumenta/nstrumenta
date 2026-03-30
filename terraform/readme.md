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

| Workspace | Purpose | Domain |
|-----------|---------|--------|
| `prod` | Production deployment | `nstrumenta.com` / `www.nstrumenta.com` |
| `ci-nst` | CI/CD testing | `ci-nst.nstrumenta.com` |

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

Configure a CNAME in your domain registrar for each workspace:

| Workspace | Record | Value |
|-----------|--------|-------|
| `prod` | `www` CNAME | `ghs.googlehosted.com.` |
| `ci-nst` | `ci-nst` CNAME | `ghs.googlehosted.com.` |

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
