#!/bin/bash
# Activate local dev environment using gh vars as the source of truth
# Prerequisites: gh auth login, gcloud auth login
NST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CI_PROJECT_ID=$(gh variable get CI_PROJECT_ID 2>/dev/null)
CI_SERVICE_ACCOUNT=$(gh variable get CI_SERVICE_ACCOUNT 2>/dev/null)
if [ -z "$CI_PROJECT_ID" ] || [ -z "$CI_SERVICE_ACCOUNT" ]; then
  echo "ERROR: Could not read CI vars from gh. Run: gh auth login"
  return 1
fi

export GOOGLE_CLOUD_PROJECT="$CI_PROJECT_ID"
gcloud config set project "$CI_PROJECT_ID" --quiet

# Check if application default credentials are valid before forcing a new login
if ! gcloud auth application-default print-access-token > /dev/null 2>&1; then
  echo "Authenticating application-default credentials..."
  gcloud auth application-default login --impersonate-service-account "$CI_SERVICE_ACCOUNT"
else
  echo "Application default credentials are valid."
fi

# Fetch Developer Seed Credentials from GitHub
NST_DEV_EMAIL=$(gh variable get NST_DEV_EMAIL 2>/dev/null)
NST_DEV_PASSWORD=$(gh variable get NST_DEV_PASSWORD 2>/dev/null)
NST_DEV_USERNAME=$(gh variable get NST_DEV_USERNAME 2>/dev/null)
NST_DEV_PROJECT=$(gh variable get NST_DEV_PROJECT 2>/dev/null)
NST_API_URL=$(gh variable get NST_API_URL 2>/dev/null)

if [ -n "$NST_DEV_EMAIL" ] && [ -n "$NST_DEV_PASSWORD" ] && [ -n "$NST_DEV_USERNAME" ] && [ -n "$NST_DEV_PROJECT" ] && [ -n "$NST_API_URL" ]; then
  export NST_DEV_EMAIL
  export NST_DEV_PASSWORD
  export NST_DEV_USERNAME
  export NST_DEV_PROJECT
  export NSTRUMENTA_API_URL=$NST_API_URL
  export NSTRUMENTA_API_KEY_PEPPER=$(gh secret get NSTRUMENTA_API_KEY_PEPPER 2>/dev/null || echo "")
  echo "Dev Seed Credentials active."
else
  echo "Warning: Some Dev Seed Credentials are missing. Ensure NST_DEV_EMAIL, NST_DEV_PASSWORD, NST_DEV_USERNAME, NST_DEV_PROJECT, and NST_API_URL are set."
fi

# Generate an ephemeral API key for local CLI interactions scoped to the nstrumenta project.
# Only generated when --api-key flag is passed explicitly.
if [[ " $* " == *" --api-key "* ]]; then
  if [ -n "$NST_DEV_PROJECT" ] && [ -d "$NST_ROOT/integration-tests/node_modules" ] && [ -f "$NST_ROOT/integration-tests/create-api-key.js" ]; then
    export NSTRUMENTA_API_KEY=$(node "$NST_ROOT/integration-tests/create-api-key.js" "$NST_DEV_PROJECT" "http://localhost:5999" 2>/dev/null | tail -n 1)
    echo "Generated temporary local NSTRUMENTA_API_KEY for nstrumenta project=$NST_DEV_PROJECT"
  else
    echo "Warning: Cannot generate NSTRUMENTA_API_KEY — NST_DEV_PROJECT or integration-tests/node_modules missing"
  fi
fi

echo "Activated: project=$GOOGLE_CLOUD_PROJECT"