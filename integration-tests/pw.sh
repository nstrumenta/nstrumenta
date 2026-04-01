#!/bin/bash -e
# Playwright fast iteration — runs tests against a persistent Angular dev server (hot reload, no build).
# Prerequisites:
#   Start watch stack once:
#     source /workspaces/nstrumenta/credentials/activate.sh
#     cd /workspaces/nstrumenta/integration-tests
#     docker compose -f docker-compose.e2e.yml -f docker-compose.e2e.watch.yml up -d server frontend-dev
#
# Usage:
#   ./pw.sh                    # run all playwright tests
#   ./pw.sh tests/foo.spec.js  # run specific test file

cd "$(dirname "$0")"

START_SECONDS=$SECONDS
TEST_FILE="${1:-}"

source ../credentials/activate.sh

COMPOSE_FILES="-f docker-compose.e2e.yml -f docker-compose.e2e.watch.yml"

if ! docker compose $COMPOSE_FILES ps --services --filter "status=running" 2>/dev/null | grep -q "^frontend-dev$"; then
    echo "Watch stack is not running. Start it with:"
    echo "  docker compose -f docker-compose.e2e.yml -f docker-compose.e2e.watch.yml up -d server frontend-dev"
    exit 1
fi

if [ ! -d "node_modules" ]; then npm install; fi

eval "$(node get-project-config.js)"
export NSTRUMENTA_API_KEY_PEPPER=$(gcloud secrets versions access latest --secret=NSTRUMENTA_API_KEY_PEPPER --project=$GOOGLE_CLOUD_PROJECT 2>/dev/null || echo '')

TEST_USER_JSON=$(node create-test-user.js)
export TEST_USER_EMAIL=$(echo "$TEST_USER_JSON" | jq -r .email)
export TEST_USER_PASSWORD=$(echo "$TEST_USER_JSON" | jq -r .password)

export NSTRUMENTA_API_KEY=$(node create-api-key.js ci http://server:5999)

PLAYWRIGHT_EXIT_CODE=0
if [ -n "$TEST_FILE" ]; then
    set +e
    docker compose $COMPOSE_FILES run --rm --no-deps playwright sh -c "npm run test:playwright -- $TEST_FILE"
    PLAYWRIGHT_EXIT_CODE=$?
    set -e
else
    set +e
    docker compose $COMPOSE_FILES run --rm playwright
    PLAYWRIGHT_EXIT_CODE=$?
    set -e
fi

ELAPSED=$(( SECONDS - START_SECONDS ))
REPORT_PATH="$(pwd)/frontend/playwright-report/index.html"

if [ $PLAYWRIGHT_EXIT_CODE -ne 0 ]; then
    echo "Tests failed in ${ELAPSED}s"
    echo "Report: file://${REPORT_PATH}"
    exit $PLAYWRIGHT_EXIT_CODE
else
    echo "Tests passed in ${ELAPSED}s"
    echo "Report: file://${REPORT_PATH}"
fi

eval "$(node get-project-config.js)"
export NSTRUMENTA_API_KEY_PEPPER=$(gcloud secrets versions access latest --secret=NSTRUMENTA_API_KEY_PEPPER --project=$GOOGLE_CLOUD_PROJECT 2>/dev/null || echo '')

TEST_USER_JSON=$(node create-test-user.js)
export TEST_USER_EMAIL=$(echo "$TEST_USER_JSON" | jq -r .email)
export TEST_USER_PASSWORD=$(echo "$TEST_USER_JSON" | jq -r .password)

export NSTRUMENTA_API_KEY=$(node create-api-key.js ci http://server:5999)

PLAYWRIGHT_EXIT_CODE=0
if [ -n "$TEST_FILE" ]; then
    set +e
    docker compose $COMPOSE_FILES run --rm playwright sh -c "npm install && npm run test:playwright -- $TEST_FILE"
    PLAYWRIGHT_EXIT_CODE=$?
    set -e
else
    set +e
    docker compose $COMPOSE_FILES run --rm playwright
    PLAYWRIGHT_EXIT_CODE=$?
    set -e
fi

ELAPSED=$(( SECONDS - START_SECONDS ))
REPORT_PATH="$(pwd)/frontend/playwright-report/index.html"

if [ $PLAYWRIGHT_EXIT_CODE -ne 0 ]; then
    echo "Tests failed in ${ELAPSED}s"
    echo "Report: file://${REPORT_PATH}"
    exit $PLAYWRIGHT_EXIT_CODE
else
    echo "Tests passed in ${ELAPSED}s"
    echo "Report: file://${REPORT_PATH}"
fi
