#!/bin/bash
PACKAGE_VERSION=$(cat package.json | jq -r '.version')
echo "package version $PACKAGE_VERSION"

# base
docker buildx build \
    --push \
    --platform linux/arm64,linux/amd64 \
    --tag nstrumenta/base:$PACKAGE_VERSION \
    .

# agent
docker buildx build \
    --push \
    --platform linux/arm64,linux/amd64 \
    --tag nstrumenta/agent:$PACKAGE_VERSION \
    -f ./cluster/agent/Dockerfile \
    .

# server
pushd cluster/server
docker buildx build \
    --push \
    --platform linux/arm64,linux/amd64 \
    --build-arg BASE_TAG=$PACKAGE_VERSION \
    --tag nstrumenta/server:$PACKAGE_VERSION \
    .
popd

# data-job-runner
pushd cluster/data-job-runner
docker buildx build \
    --push \
    --platform linux/arm64,linux/amd64 \
    --build-arg BASE_TAG=$PACKAGE_VERSION \
    --tag nstrumenta/data-job-runner:$PACKAGE_VERSION \
    .
popd

# developer
pushd cluster/developer
docker buildx build \
    --push \
    --platform linux/arm64,linux/amd64 \
    --build-arg BASE_TAG=$PACKAGE_VERSION \
    --tag nstrumenta/developer:$PACKAGE_VERSION \
    .
popd


