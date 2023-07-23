#/bin/bash -vxe
TEST_ID_BASE=${TEST_ID_BASE:-$(uuidgen)}
echo "TEST_ID_BASE= $TEST_ID_BASE"

# Load the environment variables from the specified ENVFILE
if [[ $ENVFILE ]]; then
    echo "Loading from envfile: $ENVFILE"
    if [[ -f $ENVFILE ]]; then
        while IFS= read -r line || [[ -n "$line" ]]; do
            export "$line"
        done <"$ENVFILE"
    fi
fi

if [ $# -eq 0 ]; then
    TESTS="cli nodejs-client webrtc browser-client"
else
    TESTS=$@
fi
for TEST_SERVICE in $TESTS; do
    cd $TEST_SERVICE
    if TEST_ID="$TEST_ID_BASE-$TEST_SERVICE" docker-compose -f docker-compose.yml up --build --abort-on-container-exit --exit-code-from $TEST_SERVICE 2>&1 | tee /dev/tty | grep -q "${TEST_SERVICE} exited with code 0"; then
        echo exited with code 0
        docker-compose down
    else
        exit 1
    fi
    cd ..
done
