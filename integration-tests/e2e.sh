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
CLI_TEST_ARGS=""
PLAYWRIGHT_TEST_ARGS=()
for arg in "$@"; do
    if echo "$arg" | grep -q 'tests/.*\.ts'; then
        CLI_TEST_ARGS="$arg"
    else
        normalized_arg="${arg#./}"
        normalized_arg="${normalized_arg#frontend/}"
        PLAYWRIGHT_TEST_ARGS+=("$normalized_arg")
    fi
done
export CLI_TEST_ARGS
TEST_ARGS="$(printf ' %q' "${PLAYWRIGHT_TEST_ARGS[@]}")"

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

CLI_EXIT_CODE=0
PLAYWRIGHT_EXIT_CODE=0

set +e
docker compose $COMPOSE_FILES run --build --rm cli-tests
CLI_EXIT_CODE=$?
set -e

if [ ${#PLAYWRIGHT_TEST_ARGS[@]} -gt 0 ]; then
    set +e
    docker compose $COMPOSE_FILES run --build --rm playwright sh -c "npm install && npm run test:playwright --$TEST_ARGS"
    PLAYWRIGHT_EXIT_CODE=$?
    set -e
else
    set +e
    docker compose $COMPOSE_FILES run --build --rm playwright
    PLAYWRIGHT_EXIT_CODE=$?
    set -e
fi

if [ $CLI_EXIT_CODE -ne 0 ] || [ $PLAYWRIGHT_EXIT_CODE -ne 0 ]; then
    echo "--- server logs ---"
    docker compose $COMPOSE_FILES logs server
fi

docker compose $COMPOSE_FILES down

ELAPSED=$(( SECONDS - START_SECONDS ))
REPORT_PATH="$(pwd)/frontend/playwright-report/index.html"

OVERALL_EXIT_CODE=$(( CLI_EXIT_CODE || PLAYWRIGHT_EXIT_CODE ))
if [ $OVERALL_EXIT_CODE -ne 0 ]; then
    echo "E2E tests failed in ${ELAPSED}s (cli=$CLI_EXIT_CODE playwright=$PLAYWRIGHT_EXIT_CODE)"
    echo "Report: file://${REPORT_PATH}"
    exit $OVERALL_EXIT_CODE
else
    echo "E2E tests passed in ${ELAPSED}s"
    echo "Report: file://${REPORT_PATH}"
fi
