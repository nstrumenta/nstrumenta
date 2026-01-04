#!/bin/bash -e

# Check if Docker is running early
if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is not running."
    echo "Please start Docker Desktop or run 'sudo dockerd' in the background."
    exit 1
fi

# Change to integration-tests directory
cd "$(dirname "$0")"

# Verify required variables are set
if [ -z "$NST_CI_SERVICE_KEY" ] || [ -z "$FIREBASE_API_KEY" ] || [ -z "$FIREBASE_APP_ID" ]; then
  echo "ERROR: Required environment variables not set"
  echo "Required: NST_CI_SERVICE_KEY, FIREBASE_API_KEY, FIREBASE_APP_ID"
  echo "Please ensure they are set in your environment."
  exit 1
fi

# Generate a temporary .env file for docker-compose to avoid shell mangling of JSON
# This works for both Local (sourced from local.env) and CI (env vars)
# We overwrite integration-test.env in the current directory (gitignored)
ENV_FILE="$(pwd)/integration-test.env"
cat > "$ENV_FILE" <<EOF
NST_CI_SERVICE_KEY=$NST_CI_SERVICE_KEY
NSTRUMENTA_API_KEY_PEPPER=$NSTRUMENTA_API_KEY_PEPPER
FIREBASE_API_KEY=$FIREBASE_API_KEY
FIREBASE_APP_ID=$FIREBASE_APP_ID
TEST_USER_EMAIL=$TEST_USER_EMAIL
TEST_USER_PASSWORD=$TEST_USER_PASSWORD
EOF
echo "Generated env file at $(pwd)/$ENV_FILE"

# Install dependencies for key generation script if needed
if [ ! -d "node_modules" ]; then
    echo "Installing integration test dependencies..."
    npm install
fi

# Export GCLOUD_SERVICE_KEY for create-api-key.js (it expects this var name)
export GCLOUD_SERVICE_KEY="$NST_CI_SERVICE_KEY"

# Cleanup function to run on exit
cleanup() {
    if [ -n "$CURRENT_TEST_DIR" ] && [ -d "$CURRENT_TEST_DIR" ]; then
        echo "Cleaning up containers..."
        (cd "$CURRENT_TEST_DIR" && docker compose down 2>/dev/null || true)
    fi
    if [ -f "$ENV_FILE" ]; then
        echo "Removing temporary env file..."
        rm -f "$ENV_FILE"
    fi
}
trap cleanup EXIT

TEST_ID_BASE=${TEST_ID_BASE:-$(node -p "crypto.randomUUID()")}
echo "TEST_ID_BASE= $TEST_ID_BASE"

if [ -z "$NSTRUMENTA_CLOUD_RUN_MODE" ] && [ -z "$CI" ]; then
    export NSTRUMENTA_CLOUD_RUN_MODE=local
fi

# If running in local mode, ensure we use the local server by unsetting API_URL
# This prevents accidental usage of remote servers (e.g. from local.env) when running local tests
if [ "$NSTRUMENTA_CLOUD_RUN_MODE" = "local" ] && [ -n "$API_URL" ]; then
    echo "WARN: NSTRUMENTA_CLOUD_RUN_MODE is local, but API_URL is set to '$API_URL'."
    echo "Unsetting API_URL to ensure tests run against the local server container."
    unset API_URL
fi

echo "NSTRUMENTA_CLOUD_RUN_MODE=${NSTRUMENTA_CLOUD_RUN_MODE:-remote}"

# Load the environment variables from the specified ENVFILE
if [[ $ENVFILE ]]; then
    echo "Loading from envfile: $ENVFILE"
    if [[ -f $ENVFILE ]]; then
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Skip comments and empty lines
            if [[ "$line" =~ ^#.* ]] || [[ -z "$line" ]]; then
                continue
            fi
            export "$line"
        done <"$ENVFILE"
    fi
fi

# Install dependencies for key generation script if needed
if [ ! -d "node_modules" ]; then
    echo "Installing integration test dependencies..."
    npm install
fi

# Export GCLOUD_SERVICE_KEY for create-api-key.js (it expects this var name)
export GCLOUD_SERVICE_KEY="$NST_CI_SERVICE_KEY"

# Generate API Key for CI project
if [ -z "$NSTRUMENTA_API_KEY" ]; then
    echo "Generating API Key for project 'ci'..."
    export NSTRUMENTA_API_KEY=$(node create-api-key.js ci http://nstrumenta-server:5999)
    echo "API Key generated."
else
    echo "Using existing NSTRUMENTA_API_KEY"
fi

if [ -n "$API_URL" ]; then
    export NSTRUMENTA_API_URL=$API_URL
fi

# Ensure nstrumenta_default network exists
docker network inspect nstrumenta_default >/dev/null 2>&1 || docker network create nstrumenta_default

# Build and pack unless CI flag is set (CI uses persisted artifacts from build job)
if [ -z "$CI" ]; then
    echo "Building fresh CLI and server for e2e tests..."
    (cd .. && npm run build:cli && npm run build:server)
    echo "Creating build directory..."
    mkdir -p ../build
    echo "Removing old tarballs..."
    rm -f ../build/nstrumenta-*.tgz ../build/nst-server-*.tgz
    echo "Packing nstrumenta..."
    (cd .. && npm pack && mv nstrumenta-*.tgz build/)
    echo "Packing server..."
    (cd ../server/app && npm pack && mv nst-server-*.tgz ../../build/)
else
    echo "Skipping build (using cached artifacts from CI workspace)"
fi

if [ $# -eq 0 ]; then
    TESTS="cli"
else
    TESTS=$@
fi
for TEST_SERVICE in $TESTS; do
    cd $TEST_SERVICE
    CURRENT_TEST_DIR="$(pwd)"
    # Pass CACHE_BUST to force rebuild in CI, while allowing local caching
    CACHE_BUST_ARG=""
    if [ -n "$CI" ]; then
        CACHE_BUST_ARG="--build-arg CACHE_BUST=$(date +%s)"
    fi
    
    # Use --env-file to properly pass JSON credentials without shell interpretation
    # ENV_FILE is set earlier to integration-test.env in the integration-tests directory
    # We need to use the absolute path or relative path from the docker-compose file location
    # Since we cd into $TEST_SERVICE, we need to adjust the path
    if TEST_ID="$TEST_ID_BASE-$TEST_SERVICE" docker compose --env-file "$ENV_FILE" -f docker-compose.yml build $CACHE_BUST_ARG && \
       TEST_ID="$TEST_ID_BASE-$TEST_SERVICE" docker compose --env-file "$ENV_FILE" -f docker-compose.yml up --abort-on-container-exit --exit-code-from $TEST_SERVICE 2>&1 | tee /dev/tty | grep -qE "${TEST_SERVICE}(-[0-9]+)? exited with code 0"; then
        echo exited with code 0
        docker compose down
        CURRENT_TEST_DIR=""
    else
        exit 1
    fi
    cd ..
done
