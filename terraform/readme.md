# Terraform

Infrastructure-as-code for provisioning nstrumenta deployments.

## Architecture

**Fully serverless with $0 fixed monthly costs when not in use:**

- **Firebase Project**: Firestore database, Cloud Storage, Firebase Auth
- **Cloud Run**: Serves both backend API and frontend static files
- **Firebase Hosting**: CDN for frontend with custom domain support
- **Hub Project**: Shared DNS zone for workspace subdomains (app.nstrumenta.com)
- **Cloud Functions**: Storage triggers for Firestore metadata
- **Secret Manager**: API key pepper storage
- **Artifact Registry**: Container image storage for CI builds
- **Workload Identity Federation**: Keyless GitHub Actions authentication

## Workspaces

| Workspace | Purpose | Domain |
|-----------|---------|--------|
| `prod` | Production deployment | `nstrumenta.com` / `www.nstrumenta.com` |
| `ci-nst` | CI/CD testing | `ci-nst.app.nstrumenta.com` |

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
- `custom_domain`: (optional) e.g. `www.nstrumenta.com` for prod

## DNS

**For `*.app.nstrumenta.com` workspaces:** Automatic via the hub DNS zone (CNAME created by Terraform).

**For `nstrumenta.com` (prod):** Configure in domain registrar:
1. Add CNAME: `www` -> `ghs.googlehosted.com.`
2. Add redirect: `nstrumenta.com` -> `https://www.nstrumenta.com`

## Deploy

```shell
terraform plan
terraform apply
```

## Continuous Delivery

On version tags (`v*`), GitHub Actions automatically:
1. Builds and tests all packages
2. Pushes Docker images to Artifact Registry, then Docker Hub
3. Deploys to prod Cloud Run
4. Deploys frontend to Firebase Hosting

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

## Hub Setup (One-Time)

The hub project hosts the shared DNS zone for `app.nstrumenta.com`:

```shell
cd terraform/hub
terraform init
terraform apply
```

Then add the provided name servers to your domain registrar.
