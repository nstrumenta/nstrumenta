#!/bin/bash
# Source local dev environment variables and prepare ADC for docker-compose
# Prerequisites:
#   gcloud auth application-default login
#   gcloud config set project <your-project-id>
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a
source "$DIR/local.env"
set +a

# Read project ID from gcloud config (needed by docker-compose)
export GOOGLE_CLOUD_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
  echo "WARNING: No gcloud project set. Run: gcloud config set project <project-id>"
fi

ADC_SOURCE="${HOME}/.config/gcloud/application_default_credentials.json"
ADC_TARGET="${DIR}/application_default_credentials.json"
if [ -f "$ADC_SOURCE" ]; then
  cp "$ADC_SOURCE" "$ADC_TARGET"
else
  echo "WARNING: $ADC_SOURCE not found. Run: gcloud auth application-default login"
fi
echo "Activated: project=$GOOGLE_CLOUD_PROJECT"