#!/bin/bash -e
# E2E test runner — Playwright tests in Docker Compose
# Prerequisites: gcloud auth application-default login && gcloud config set project <project-id>

cd "$(dirname "$0")"

if [ ! -f "$HOME/.config/gcloud/application_default_credentials.json" ]; then
    echo "Run: gcloud auth application-default login"
    exit 1
fi

export GOOGLE_CLOUD_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "Run: gcloud config set project <project-id>"
    exit 1
fi

if [ ! -d "node_modules" ]; then npm install; fi

eval "$(node get-project-config.js)"
export NSTRUMENTA_API_KEY_PEPPER=$(gcloud secrets versions access latest --secret=NSTRUMENTA_API_KEY_PEPPER --project=$GOOGLE_CLOUD_PROJECT 2>/dev/null || echo '')

if [ ! -d "../frontend/dist" ]; then
    echo "Building frontend..."
    (cd ../frontend && npm install && npm run build)
fi

TEST_USER_JSON=$(node create-test-user.js)
export TEST_USER_EMAIL=$(echo "$TEST_USER_JSON" | jq -r .email)
export TEST_USER_PASSWORD=$(echo "$TEST_USER_JSON" | jq -r .password)

export NSTRUMENTA_API_KEY=$(node create-api-key.js ci http://server:5999)

docker compose -f docker-compose.e2e.yml up --build -d server
docker compose -f docker-compose.e2e.yml run --rm cli-tests
docker compose -f docker-compose.e2e.yml run --rm playwright
docker compose -f docker-compose.e2e.yml down
