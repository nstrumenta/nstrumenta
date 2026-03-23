#!/bin/bash
# Activate local dev environment using gh vars as the source of truth
# Prerequisites: gh auth login
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export GOOGLE_CLOUD_PROJECT=$(gh variable get CI_PROJECT_ID 2>/dev/null)
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
  echo "ERROR: Could not read CI_PROJECT_ID from gh vars. Run: gh auth login"
  return 1
fi
echo "Activated: project=$GOOGLE_CLOUD_PROJECT"