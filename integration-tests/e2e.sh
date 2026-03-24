#!/bin/bash -e
# E2E test runner — runs CLI tests and Playwright tests in Docker Compose
# Prerequisites: source credentials/activate.sh

cd "$(dirname "$0")"

if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "GOOGLE_CLOUD_PROJECT is not set. Run: source credentials/activate.sh"
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
set +e
docker compose -f docker-compose.e2e.yml run --rm playwright
PLAYWRIGHT_EXIT_CODE=$?
set -e

docker compose -f docker-compose.e2e.yml down

if [ $PLAYWRIGHT_EXIT_CODE -ne 0 ]; then
    echo "❌ Playwright E2E tests failed!"
    echo "View report: file://$(pwd)/frontend/playwright-report/index.html"
    exit $PLAYWRIGHT_EXIT_CODE
fi
