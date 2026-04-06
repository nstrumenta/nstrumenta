#!/bin/bash -e
# Full E2E test run — CI-equivalent: builds server image, runs all tests, tears down.
# For fast frontend iteration, use pw.sh instead.
# Prerequisites: source credentials/activate.sh
#
# Usage:
#   ./e2e.sh                    # run all tests
#   ./e2e.sh tests/foo.spec.js  # run specific test file

cd "$(dirname "$0")"

START_SECONDS=$SECONDS
TEST_ARGS="$*"

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

COMPOSE_FILES="-f docker-compose.e2e.yml"
docker compose $COMPOSE_FILES up --build -d server

PLAYWRIGHT_EXIT_CODE=0
if [ -n "$TEST_ARGS" ]; then
    set +e
    docker compose $COMPOSE_FILES run --rm playwright sh -c "npm install && npm run test:playwright -- $TEST_ARGS"
    PLAYWRIGHT_EXIT_CODE=$?
    set -e
else
    set +e
    docker compose $COMPOSE_FILES run --rm playwright
    PLAYWRIGHT_EXIT_CODE=$?
    set -e
fi

docker compose $COMPOSE_FILES down

ELAPSED=$(( SECONDS - START_SECONDS ))
REPORT_PATH="$(pwd)/frontend/playwright-report/index.html"

if [ $PLAYWRIGHT_EXIT_CODE -ne 0 ]; then
    echo "E2E tests failed in ${ELAPSED}s"
    echo "Report: file://${REPORT_PATH}"
    exit $PLAYWRIGHT_EXIT_CODE
else
    echo "E2E tests passed in ${ELAPSED}s"
    echo "Report: file://${REPORT_PATH}"
fi
