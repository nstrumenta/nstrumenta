#!/bin/bash -e
# Frontend E2E watch mode — runs Playwright tests against a persistent Angular dev server (hot reload, no build).
#
# Usage:
#   ./frontend-e2e-watch.sh up                 # start watch stack (server + frontend-dev)
#   ./frontend-e2e-watch.sh down               # tear down watch stack
#   ./frontend-e2e-watch.sh                    # run all playwright tests
#   ./frontend-e2e-watch.sh tests/foo.spec.js  # run specific test file

cd "$(dirname "$0")"

source ../credentials/activate.sh

COMPOSE_FILES="-f docker-compose.e2e.yml -f docker-compose.e2e.watch.yml"
SUBCOMMAND="${1:-}"

case "$SUBCOMMAND" in
  up)
    eval "$(node get-project-config.js)"
    docker compose $COMPOSE_FILES up -d server frontend-dev
    exit 0
    ;;
  down)
    docker compose $COMPOSE_FILES down
    exit 0
    ;;
esac

START_SECONDS=$SECONDS
PLAYWRIGHT_TEST_ARGS=()
for arg in "$@"; do
    normalized_arg="${arg#./}"
    normalized_arg="${normalized_arg#tests/}"
    PLAYWRIGHT_TEST_ARGS+=("$normalized_arg")
done
TEST_ARGS="$(printf ' %q' "${PLAYWRIGHT_TEST_ARGS[@]}")"

# Verify the watch stack is running before wasting time on setup
if ! docker compose $COMPOSE_FILES exec -T server sh -c "wget -qO- http://localhost:5999/health" > /dev/null 2>&1; then
    echo "Error: server is not running. Start the watch stack first: ./frontend-e2e-watch.sh up"
    exit 1
fi

if [ ! -d "node_modules" ]; then npm install; fi

eval "$(node get-project-config.js)"
export NSTRUMENTA_API_KEY_PEPPER=$(gcloud secrets versions access latest --secret=NSTRUMENTA_API_KEY_PEPPER --project=$GOOGLE_CLOUD_PROJECT 2>/dev/null || echo '')

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

PLAYWRIGHT_EXIT_CODE=0
if [ ${#PLAYWRIGHT_TEST_ARGS[@]} -gt 0 ]; then
    set +e
    docker compose $COMPOSE_FILES run --rm --no-deps playwright sh -c "npm run test:playwright --$TEST_ARGS"
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
