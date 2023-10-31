#!/bin/bash
PACKAGE_VERSION=$(cat package.json | jq -r '.version')
echo "package version $PACKAGE_VERSION"

if [ -n "$BUILDX_ARGS" ]; then
    echo "building with BUILDX_ARGS $BUILDX_ARGS"
fi

docker buildx create --use

# base
docker buildx build \
    $BUILDX_ARGS \
    --platform linux/arm64,linux/amd64 \
    --tag nstrumenta/base:$PACKAGE_VERSION \
    .

# agent
docker buildx build \
    $BUILDX_ARGS \
    --platform linux/arm64,linux/amd64 \
    --tag nstrumenta/agent:$PACKAGE_VERSION \
    -f ./cluster/agent/Dockerfile \
    .

# server
pushd cluster/server
docker buildx build \
    $BUILDX_ARGS \
    --platform linux/arm64,linux/amd64 \
    --build-arg BASE_TAG=$PACKAGE_VERSION \
    --tag nstrumenta/server:$PACKAGE_VERSION \
    .
popd

# data-job-runner
docker buildx build \
    $BUILDX_ARGS \
    --platform linux/arm64,linux/amd64 \
    --build-arg BASE_TAG=$PACKAGE_VERSION \
    --tag nstrumenta/data-job-runner:$PACKAGE_VERSION \
    -f ./cluster/data-job-runner/Dockerfile \
    .

# developer
docker buildx build \
    $BUILDX_ARGS \
    --platform linux/arm64,linux/amd64 \
    --build-arg BASE_TAG=$PACKAGE_VERSION \
    --tag nstrumenta/developer:$PACKAGE_VERSION \
    -f ./cluster/developer/Dockerfile \
    .
