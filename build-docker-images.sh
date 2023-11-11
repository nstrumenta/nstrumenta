#!/bin/bash -x
PACKAGE_VERSION=$(cat package.json | jq -r '.version')
echo "package version $PACKAGE_VERSION"


# login to docker
if [ -n "$DOCKER_HUB_ACCESS_TOKEN" ]; then
    echo "$DOCKER_HUB_ACCESS_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
fi


# in ci use BUILDX_ARGS="--push --quiet"
if [ -n "$BUILDX_ARGS" ]; then
    echo "building with BUILDX_ARGS $BUILDX_ARGS"
fi

BUILDX_CONTAINER_NAME=buildx-$PACKAGE_VERSION
if $(docker buildx inspect $BUILDX_CONTAINER_NAME); then
    echo "using existing $BUILDX_CONTAINER_NAME"
else
    echo "creating $BUILDX_CONTAINER_NAME"
    docker buildx create --name $BUILDX_CONTAINER_NAME --platform linux/arm64,linux/amd64 --driver docker-container --use
fi

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
