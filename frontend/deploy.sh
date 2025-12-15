#!/bin/bash
set -e

# Frontend Deployment Script
# 
# Prerequisites (handled by Terraform):
# - GCS bucket for frontend static files
# - Load Balancer with CDN
# - Google-managed SSL certificate
# - DNS records pointing to Load Balancer
# - Config bucket with firebaseConfig.json
#
# This script handles:
# - Fetching Firebase config
# - Building the frontend
# - Uploading to GCS bucket

if [ -z "$FIREBASE_PROJECT_ID" ]; then
  echo "Error: FIREBASE_PROJECT_ID environment variable is not set"
  exit 1
fi

echo "Deploying frontend for project: $FIREBASE_PROJECT_ID"

# Fetch Firebase config from Terraform-managed config bucket
echo "Fetching Firebase configuration..."
node fetchFirebaseConfigJson.js

# Build the frontend
echo "Building frontend..."
npm run build

# Upload to GCS bucket
echo "Uploading to GCS bucket..."
gsutil -m rsync -r -d dist/ gs://${FIREBASE_PROJECT_ID}-frontend/

echo "Deployment complete!"
echo "Frontend URL: https://${FIREBASE_PROJECT_ID}.nstrumenta.com"
echo "Note: SSL certificate provisioning may take up to 15 minutes on first deployment"
