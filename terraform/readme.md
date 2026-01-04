# Terraform

Infrastructure-as-code for provisioning new nstrumenta deployments.

## Architecture

**Fully serverless with $0 fixed monthly costs when not in use:**

- **Firebase Project**: Firestore database, Cloud Storage, Firebase Auth
- **Cloud Run**: Serves both backend API and frontend static files
- **Cloud Run Domain Mapping**: Custom domains with automatic SSL (no load balancer needed!)
- **Hub Project**: Shared DNS zone for all workspaces (app.nstrumenta.com)
- **Cloud Functions**: Storage triggers for data processing
- **Secret Manager**: Secure credential storage

Each workspace gets a custom domain like `dev.app.nstrumenta.com` via direct CNAME in the hub zone.

## Setup

```shell
cd terraform
terraform init
terraform workspace new <project-name>
```

Set variables in Terraform Cloud:
- `billing_account`: from https://console.cloud.google.com/billing
- `org_id`: from https://console.cloud.google.com/
- `GITHUB_CLIENT_ID`: GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth App Client Secret (sensitive)
- `support_email`: Email for OAuth consent screen

## Deploy

```shell
terraform plan
terraform apply
```

The Cloud Run service will automatically serve:
- Frontend app at `https://<workspace>.app.nstrumenta.com/`
- Backend API at `https://<workspace>.app.nstrumenta.com/`
- Config file at `/firebaseConfig.json` (deployment config now served via `/config` endpoint)

SSL certificates are managed automatically by Cloud Run domain mapping.

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


