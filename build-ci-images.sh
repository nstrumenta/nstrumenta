#!/bin/bash -ex

# agent
docker build -t $IMAGE_REPOSITORY/agent:$IMAGE_VERSION_TAG -f ./cluster/agent/Dockerfile .
docker push $IMAGE_REPOSITORY/agent:$IMAGE_VERSION_TAG

# backplane
docker build -t $IMAGE_REPOSITORY/backplane:$IMAGE_VERSION_TAG -f ./cluster/backplane/Dockerfile .
docker push $IMAGE_REPOSITORY/backplane:$IMAGE_VERSION_TAG

# data-job-runner
docker build -t $IMAGE_REPOSITORY/data-job-runner:$IMAGE_VERSION_TAG -f ./cluster/data-job-runner/Dockerfile .
docker push $IMAGE_REPOSITORY/data-job-runner:$IMAGE_VERSION_TAG

# server
pushd cluster/server
docker build -t $IMAGE_REPOSITORY/server:$IMAGE_VERSION_TAG .
docker push $IMAGE_REPOSITORY/server:$IMAGE_VERSION_TAG
popd