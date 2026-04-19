#!/bin/bash -e
# Full CLI E2E run — CI-equivalent: builds server image, runs all CLI tests, tears down.
# Prerequisites: source credentials/activate.sh
#
# Usage:
#   ./cli-e2e.sh   # run all CLI tests

cd "$(dirname "$0")"

START_SECONDS=$SECONDS

if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "GOOGLE_CLOUD_PROJECT is not set. Run: source credentials/activate.sh"
    exit 1
fi

eval "$(node get-project-config.js)"
NSTRUMENTA_API_KEY_PEPPER=$(gcloud secrets versions access latest --secret=NSTRUMENTA_API_KEY_PEPPER --project=$GOOGLE_CLOUD_PROJECT)
export NSTRUMENTA_API_KEY_PEPPER

if [ -z "$CLOUD_REGION" ] || [ -z "$PREVIEW_IMAGE_REGISTRY" ]; then
    echo "CLOUD_REGION and PREVIEW_IMAGE_REGISTRY are not set. Run: source credentials/activate.sh"
    exit 1
fi

COMPOSE_FILES="-f docker-compose.e2e.yml"
docker compose $COMPOSE_FILES up --build -d server

CLI_EXIT_CODE=0
set +e
docker compose $COMPOSE_FILES run --build --rm cli-tests
CLI_EXIT_CODE=$?
set -e

docker compose $COMPOSE_FILES down

ELAPSED=$(( SECONDS - START_SECONDS ))

if [ $CLI_EXIT_CODE -ne 0 ]; then
    echo "CLI E2E tests failed in ${ELAPSED}s"
    exit $CLI_EXIT_CODE
else
    echo "CLI E2E tests passed in ${ELAPSED}s"
fi
