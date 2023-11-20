#!/bin/bash -ex

if [ -n "$DOCKER_TAG" ]; then
    echo "using DOCKER_TAG=$DOCKER_TAG"
else
    PACKAGE_VERSION=$(cat package.json | jq -r '.version')
    echo "package version $PACKAGE_VERSION"
    DOCKER_TAG=$PACKAGE_VERSION
fi

# login to docker
if [ -n "$DOCKER_HUB_ACCESS_TOKEN" ]; then
    echo "$DOCKER_HUB_ACCESS_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
fi

# to push BUILDX_ARGS="--push"
if [ -n "$BUILDX_ARGS" ]; then
    echo "building with BUILDX_ARGS $BUILDX_ARGS"
fi

# in ci BUILD_TAG_LATEST
if [ -n "$BUILD_TAG_LATEST" ]; then
    echo "tagging latest"
fi

BUILDX_CONTAINER_NAME=buildx-$DOCKER_TAG
if $(docker buildx inspect $BUILDX_CONTAINER_NAME); then
    echo "using existing $BUILDX_CONTAINER_NAME"
else
    echo "creating $BUILDX_CONTAINER_NAME"
    docker buildx create --name $BUILDX_CONTAINER_NAME --platform linux/arm64,linux/amd64 --driver docker-container --use
fi

# base
docker buildx build \
    $BUILDX_ARGS \
    --cache-from nstrumenta/base:buildcache-arm64 \
    --cache-from nstrumenta/base:buildcache-amd64 \
    --platform linux/arm64,linux/amd64 \
    --tag nstrumenta/base:$DOCKER_TAG \
    --tag nstrumenta/base:latest \
    .

# base caches
docker buildx build \
    $BUILDX_ARGS \
    --cache-from nstrumenta/base:buildcache-arm64 \
    --cache-to nstrumenta/base:buildcache-arm64 \
    --platform linux/arm64 \
    --tag nstrumenta/base:$DOCKER_TAG \
    .

docker buildx build \
    $BUILDX_ARGS \
    --cache-from nstrumenta/base:buildcache-amd64 \
    --cache-to nstrumenta/base:buildcache-amd64 \
    --platform linux/amd64 \
    --tag nstrumenta/base:$DOCKER_TAG \
    .

# agent
docker buildx build \
    $BUILDX_ARGS \
    --platform linux/arm64,linux/amd64 \
    --tag nstrumenta/agent:$DOCKER_TAG \
    --tag nstrumenta/agent:latest \
    -f ./cluster/agent/Dockerfile \
    .

# server
pushd cluster/server
docker buildx build \
    $BUILDX_ARGS \
    --platform linux/arm64,linux/amd64 \
    --build-arg BASE_TAG=$DOCKER_TAG \
    --tag nstrumenta/server:$DOCKER_TAG \
    --tag nstrumenta/server:latest \
    .
popd

# data-job-runner
docker buildx build \
    $BUILDX_ARGS \
    --platform linux/arm64,linux/amd64 \
    --build-arg BASE_TAG=$DOCKER_TAG \
    --tag nstrumenta/data-job-runner:$DOCKER_TAG \
    --tag nstrumenta/data-job-runner:latest \
    -f ./cluster/data-job-runner/Dockerfile \
    .

# developer
docker buildx build \
    $BUILDX_ARGS \
    --platform linux/arm64,linux/amd64 \
    --build-arg BASE_TAG=$DOCKER_TAG \
    --tag nstrumenta/developer:$DOCKER_TAG \
    --tag nstrumenta/developer:latest \
    -f ./cluster/developer/Dockerfile \
    .
