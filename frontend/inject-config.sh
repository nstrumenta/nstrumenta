#!/bin/bash
set -e

# Injects Firebase config into index.html as window.__NST_CONFIG__ so the
# frontend can boot without waiting for a Cloud Run cold start on /config.
#
# Required env vars: FIREBASE_API_KEY, FIREBASE_APP_ID, GOOGLE_CLOUD_PROJECT
# Optional env vars: NST_API_URL (defaults to empty, frontend uses window.location.origin)
#                    BUILD_SHA (git commit sha, shown in navbar)
#
# Usage: FIREBASE_API_KEY=... FIREBASE_APP_ID=... GOOGLE_CLOUD_PROJECT=... BUILD_SHA=abc123 ./inject-config.sh [path/to/dist]

DIST_DIR="${1:-dist}"
INDEX_FILE="$DIST_DIR/index.html"

if [ ! -f "$INDEX_FILE" ]; then
    echo "Error: $INDEX_FILE not found"
    exit 1
fi

for var in FIREBASE_API_KEY FIREBASE_APP_ID GOOGLE_CLOUD_PROJECT; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set"
        exit 1
    fi
done

PROJECT_ID="$GOOGLE_CLOUD_PROJECT"
FRONTEND_SHA="${BUILD_SHA:-}"
CONFIG_JSON=$(cat <<EOF
{"apiKey":"$FIREBASE_API_KEY","authDomain":"$PROJECT_ID.firebaseapp.com","projectId":"$PROJECT_ID","appId":"$FIREBASE_APP_ID","apiUrl":"${NST_API_URL:-}","frontendSha":"$FRONTEND_SHA"}
EOF
)

CONFIG_SCRIPT="<script>window.__NST_CONFIG__=$CONFIG_JSON;</script>"

sed -i "s|</head>|$CONFIG_SCRIPT</head>|" "$INDEX_FILE"

echo "Injected config into $INDEX_FILE"
