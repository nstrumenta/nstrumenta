# Frontend

Angular web application for project management, data visualization, and real-time sensor monitoring.

## Development

```shell
npm install
npm run serve
```

Open http://localhost:5008. Add `localhost` to Firebase authorized domains.

## Deploy with Terraform

The frontend is fully managed by Terraform and deployed to Google Cloud Storage with a global Load Balancer and CDN.

### Initial Setup

1. Navigate to terraform directory and apply infrastructure:
```shell
cd ../terraform
terraform workspace select <your-workspace> || terraform workspace new <your-workspace>
terraform apply
```

This creates:
- GCS bucket for static files
- Global Load Balancer with CDN
- Google-managed SSL certificate (auto-renewing)
- DNS records for your domain
- Automatic frontend build and upload

### Manual Deploy (if needed)

If you need to deploy without running full Terraform apply:

```shell
export FIREBASE_PROJECT_ID=<your-project-id>
./deploy.sh
```

This script:
1. Fetches Firebase config from GCS
2. Builds the frontend
3. Uploads to GCS bucket

### Frontend URL

After Terraform apply, your frontend will be available at:
- `https://<workspace>.nstrumenta.com`
- `https://www.<workspace>.nstrumenta.com`

**Note:** SSL certificate provisioning takes 10-15 minutes on first deployment.

### Firebase Authentication

Update Firebase authorized domains in the Firebase Console:
- Navigate to Authentication → Settings → Authorized domains
- Add: `<workspace>.nstrumenta.com`

### CORS Configuration

CORS on the default appspot bucket is managed by Terraform. No manual steps required.

