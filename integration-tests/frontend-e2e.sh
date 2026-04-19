#!/bin/bash -e
# Full frontend E2E run — CI-equivalent: builds server image, runs all Playwright tests, tears down.
# For fast iteration with hot reload, use frontend-e2e-watch.sh instead.
# Prerequisites: source credentials/activate.sh
#
# Usage:
#   ./frontend-e2e.sh                    # run all tests
#   ./frontend-e2e.sh tests/foo.spec.js  # run specific test file

cd "$(dirname "$0")"

START_SECONDS=$SECONDS
TEST_ARGS="$*"

if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "GOOGLE_CLOUD_PROJECT is not set. Run: source credentials/activate.sh"
    exit 1
fi

if [ ! -d "node_modules" ]; then npm install; fi

eval "$(node get-project-config.js)"
NSTRUMENTA_API_KEY_PEPPER=$(gcloud secrets versions access latest --secret=NSTRUMENTA_API_KEY_PEPPER --project=$GOOGLE_CLOUD_PROJECT)
export NSTRUMENTA_API_KEY_PEPPER

if [ ! -d "../frontend/dist" ]; then
    echo "Building frontend..."
    (cd ../frontend && npm install && npm run build)
fi

TEST_USER_JSON=$(node create-test-user.js)
export TEST_USER_EMAIL=$(echo "$TEST_USER_JSON" | jq -r .email)
export TEST_USER_PASSWORD=$(echo "$TEST_USER_JSON" | jq -r .password)
TEST_USER_UID=$(echo "$TEST_USER_JSON" | jq -r .uid)
TEST_USER_USERNAME=$(echo "$TEST_USER_JSON" | jq -r .username)

TEST_ADMIN_JSON=$(node create-test-user.js --admin)
export TEST_ADMIN_EMAIL=$(echo "$TEST_ADMIN_JSON" | jq -r .email)
export TEST_ADMIN_PASSWORD=$(echo "$TEST_ADMIN_JSON" | jq -r .password)
TEST_ADMIN_UID=$(echo "$TEST_ADMIN_JSON" | jq -r .uid)

cleanup_users() {
    echo "Cleaning up test users..."
    node delete-test-user.js "$TEST_USER_UID" 2>&1 || true
    node delete-test-user.js "$TEST_ADMIN_UID" 2>&1 || true
}
trap cleanup_users EXIT

export NSTRUMENTA_API_KEY=$(node create-api-key.js "${TEST_USER_USERNAME}/ci" http://server:5999)

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
    docker compose $COMPOSE_FILES run --build --rm playwright
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
