# Terraform

Infrastructure-as-code for provisioning nstrumenta deployments.

## Architecture

**Fully serverless with $0 fixed monthly costs when not in use:**

- **Firebase Project**: Firestore database, Cloud Storage, Firebase Auth
- **Cloud Run**: Serves both backend API and frontend static files
- **Cloud Run Domain Mapping**: Custom domains with automatic SSL (no load balancer needed!)
- **Hub Project**: Shared DNS zone for all workspaces (app.nstrumenta.com)
- **Cloud Functions**: Storage triggers for data processing
- **Secret Manager**: Secure credential storage

## Workspaces

| Workspace | Purpose | Domain |
|-----------|---------|--------|
| `prod` | Production deployment | `www.nstrumenta.com` (via `custom_domain`) |
| `ci-nst` | CI/CD testing | `ci-nst.app.nstrumenta.com` |

The `app.nstrumenta.com` subdomain pattern is reserved for future enterprise accounts.

## Setup

```shell
cd terraform
terraform init
terraform workspace new <workspace-name>
```

Set variables in Terraform Cloud:
- `billing_account`: from https://console.cloud.google.com/billing
- `org_id`: from https://console.cloud.google.com/
- `GITHUB_CLIENT_ID`: GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth App Client Secret (sensitive)
- `support_email`: Email for OAuth consent screen
- `custom_domain`: (optional) Override the default `{workspace}.app.nstrumenta.com` domain

For the `prod` workspace, set `custom_domain = "www.nstrumenta.com"`.

## DNS Setup

**For `*.app.nstrumenta.com` workspaces:** DNS is automatic via the GCP hub zone.

**For `www.nstrumenta.com` (prod):** Configure in Squarespace DNS:
1. Add CNAME: `www` -> `ghs.googlehosted.com.`
2. Add redirect: `nstrumenta.com` -> `https://www.nstrumenta.com` (Squarespace handles apex redirects)
3. Verify `www.nstrumenta.com` in Google Search Console for the Terraform service account

## Deploy

```shell
terraform plan
terraform apply
```

## Continuous Delivery

On version tags (`v*`), CircleCI automatically:
1. Builds and tests
2. Pushes Docker images to Docker Hub
3. Runs `terraform apply` against the `prod` workspace with the new version

## Outputs

```shell
terraform output project_id
terraform output domain
terraform output cloud_run_url
terraform output nstrumenta_version
```

## to Rotate Keys:
```
terraform taint google_service_account_key.server
terraform apply
```

## Hub Setup (One-Time)

The hub project hosts the shared DNS zone for `app.nstrumenta.com`:

```shell
cd terraform/hub
terraform init
terraform apply
```

Then add the provided name servers to your domain registrar (Squarespace, etc.).

## if not using terraform cloud
### gcloud auth with user account
```
gcloud auth application-default login
```

### gcloud auth with service account
```
gcloud auth activate-service-account --key-file [path to key-file]
```


