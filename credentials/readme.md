# Credentials

Local credentials for development (gitignored).

## Required Files

### local.env
```env
GCLOUD_SERVICE_KEY={"type":"service_account",...}
NSTRUMENTA_API_KEY=<project-api-key>
FIREBASE_API_KEY=<web-api-key>
FIREBASE_APP_ID=<app-id>
```

Credentials for your local development workspace (e.g., demo, pni-nst).

Get `GCLOUD_SERVICE_KEY` from your Firebase service account:
https://cloud.google.com/iam/docs/keys-create-delete

Get `NSTRUMENTA_API_KEY` from the frontend Settings page.

Get `FIREBASE_API_KEY` and `FIREBASE_APP_ID` from Firebase Console:
1. Go to Project Settings > General
2. Under "Your apps", find the Web app
3. Copy the `apiKey` and `appId` values

### integration-test.env
```env
GCLOUD_SERVICE_KEY={"type":"service_account","project_id":"nst-ci-nst-...",...}
NSTRUMENTA_API_KEY_PEPPER=<pepper-value>
FIREBASE_API_KEY=<ci-nst-web-api-key>
FIREBASE_APP_ID=<ci-nst-app-id>
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

Credentials specifically for the **ci-nst terraform workspace** (integration testing project).

**To get ci-nst credentials:**
```bash
cd terraform
terraform workspace select ci-nst
terraform output -json | jq '{project_id, firebase_api_key: .firebase_web_api_key.value, firebase_app_id: .firebase_web_app_id.value}'
```

**To get the service account key:**
1. Go to GCP Console > IAM & Admin > Service Accounts
2. Select the ci-nst project
3. Find `nstrumenta-firebase-admin` service account
4. Create and download a JSON key
5. Format as single-line JSON for the env file


