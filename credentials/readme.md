# Credentials

Local credentials for development (all files in this directory are gitignored).

## Prerequisites

```shell
gh auth login
gcloud auth login
```

No `.env` files, no key files. `activate.sh` reads all configuration from GitHub variables and sets up ADC via service account impersonation.

## Setup

```shell
source credentials/activate.sh
```

This script:
1. Reads `CI_PROJECT_ID` and `CI_SERVICE_ACCOUNT` from `gh variable`
2. Sets `GOOGLE_CLOUD_PROJECT` and configures `gcloud`
3. Authenticates ADC with `--impersonate-service-account` so signed URL generation works locally the same as in CI
4. Exports dev seed credentials (`NST_DEV_*`) from GitHub variables for `npm run seed`

ADC credentials are written to `~/.config/gcloud/application_default_credentials.json` on the host and mounted read-only into docker compose containers automatically.

