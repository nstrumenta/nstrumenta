#!/bin/bash
# Activate local dev environment using gh vars as the source of truth
# Prerequisites: gh auth login, gcloud auth login
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

echo "Activated: project=$GOOGLE_CLOUD_PROJECT"