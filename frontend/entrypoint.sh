#!/bin/bash
set -e

if [ -z "$GCS_BUCKET" ]; then
  echo "Error: GCS_BUCKET environment variable is not set."
  exit 1
fi

echo "Deploying frontend to gs://$GCS_BUCKET"

# Check if dist directory exists
if [ ! -d "/app/dist" ]; then
  echo "Error: /app/dist directory not found."
  exit 1
fi

# Sync files to GCS bucket
# -m: multi-threaded
# -r: recursive
# -d: delete extra files in destination (mirroring)
gsutil -m rsync -r -d /app/dist gs://$GCS_BUCKET/

echo "Deployment complete."

# Invalidate CDN cache if URL_MAP is set
if [ -n "$URL_MAP" ]; then
  echo "Invalidating CDN cache for $URL_MAP"
  gcloud compute url-maps invalidate-cdn-cache "$URL_MAP" \
    --path "/*" \
    --async
  echo "CDN cache invalidation initiated."
fi
