#!/bin/bash -ex

cd "$(dirname "$0")"

# agent
docker build -t $IMAGE_REPOSITORY/agent:$IMAGE_VERSION_TAG -f ./agent/Dockerfile .
docker push $IMAGE_REPOSITORY/agent:$IMAGE_VERSION_TAG

# data-job-runner
docker build -t $IMAGE_REPOSITORY/data-job-runner:$IMAGE_VERSION_TAG -f ./data-job-runner/Dockerfile .
docker push $IMAGE_REPOSITORY/data-job-runner:$IMAGE_VERSION_TAG

# server
pushd server
docker build -t $IMAGE_REPOSITORY/server:$IMAGE_VERSION_TAG .
docker push $IMAGE_REPOSITORY/server:$IMAGE_VERSION_TAG
popd