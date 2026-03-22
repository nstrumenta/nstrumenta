#!/bin/bash -e
# E2E test runner — runs tests directly against a server URL (no docker-compose)
#
# Usage:
#   ./e2e.sh cli          # Run CLI tests
#   ./e2e.sh frontend     # Run frontend/MCP tests
#   ./e2e.sh              # Run all tests
#
# Prerequisites:
#   - A running server (local via docker compose, or Cloud Run)
#   - NSTRUMENTA_API_KEY set (or will be generated via ADC)
#   - API_URL set (defaults to http://localhost:5999)

cd "$(dirname "$0")"

API_URL=${API_URL:-http://localhost:5999}
export NSTRUMENTA_API_URL=${NSTRUMENTA_API_URL:-$API_URL}

echo "Running e2e tests against $API_URL"

# Install dependencies
if [ ! -d "node_modules" ]; then
    npm install
fi

# Generate API Key if not provided
if [ -z "$NSTRUMENTA_API_KEY" ]; then
    echo "Generating API Key for project 'ci'..."
    export NSTRUMENTA_API_KEY=$(node create-api-key.js ci "$API_URL")
    echo "API Key generated."
else
    echo "Using existing NSTRUMENTA_API_KEY"
fi

TEST_ID=${TEST_ID:-$(node -p "crypto.randomUUID()")}
export TEST_ID

if [ $# -eq 0 ]; then
    TESTS="cli frontend"
else
    TESTS="$@"
fi

for TEST_SUITE in $TESTS; do
    echo "--- Running $TEST_SUITE tests ---"
    case $TEST_SUITE in
        cli)
            cd cli/client/app
            npm install
            npm test
            cd ../../..
            ;;
        frontend)
            cd frontend
            npm install
            npx vitest run mcp-client.test.js
            cd ..
            ;;
        *)
            echo "Unknown test suite: $TEST_SUITE"
            exit 1
            ;;
    esac
    echo "--- $TEST_SUITE tests passed ---"
done
