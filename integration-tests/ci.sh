#/bin/bash -vxe
TEST_ID_BASE=${TEST_ID_BASE:-$(uuidgen)}
echo "TEST_ID_BASE= $TEST_ID_BASE"

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
    npm install --no-save
fi

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

# Create tarball of the current package
echo "Packing nstrumenta..."
(cd .. && npm pack)

if [ $# -eq 0 ]; then
    TESTS="cli nodejs-client browser-client"
else
    TESTS=$@
fi
for TEST_SERVICE in $TESTS; do
    cd $TEST_SERVICE
    # Pass CACHE_BUST to force rebuild in CI, while allowing local caching
    CACHE_BUST_ARG=""
    if [ -n "$CI" ]; then
        CACHE_BUST_ARG="--build-arg CACHE_BUST=$(date +%s)"
    fi
    if TEST_ID="$TEST_ID_BASE-$TEST_SERVICE" docker compose -f docker-compose.yml build $CACHE_BUST_ARG && \
       TEST_ID="$TEST_ID_BASE-$TEST_SERVICE" docker compose -f docker-compose.yml up --abort-on-container-exit --exit-code-from $TEST_SERVICE 2>&1 | tee /dev/tty | grep -q "${TEST_SERVICE} exited with code 0"; then
        echo exited with code 0
        docker compose down
    else
        exit 1
    fi
    cd ..
done
