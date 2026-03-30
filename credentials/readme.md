# Credentials

Local credentials for development (gitignored).

## Prerequisites

Authenticate with Application Default Credentials (one-time on your host machine):

```shell
gcloud auth application-default login
gcloud config set project <your-gcp-project-id>
```

No service account key files are needed. The devcontainer mounts `~/.config/gcloud` from your host, so ADC is available automatically inside the container.

## Required Files

### local.env

```env
NSTRUMENTA_API_KEY_PEPPER=<pepper-value>
FIREBASE_API_KEY=<web-api-key>
FIREBASE_APP_ID=<app-id>
```

Get `FIREBASE_API_KEY` and `FIREBASE_APP_ID` from Firebase Console > Project Settings > General > Your apps (Web).

Get `NSTRUMENTA_API_KEY_PEPPER` from GCP Secret Manager or Terraform output.

### activate.sh

Sources `local.env`, reads the GCP project from `gcloud config`, and copies your ADC credentials for docker-compose:

```shell
source credentials/activate.sh
```

This sets `GOOGLE_CLOUD_PROJECT` and copies `~/.config/gcloud/application_default_credentials.json` into the credentials directory for docker volume mounting.

## Optional Variables

```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

Used for Playwright-based frontend integration tests.

