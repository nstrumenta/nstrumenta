#!/bin/bash -ex

# agent
docker build -t $REPOSITORY/agent:$VERSION_TAG -f ./cluster/agent/Dockerfile .
docker push $REPOSITORY/agent:$VERSION_TAG

# data-job-runner
docker build -t $REPOSITORY/data-job-runner:$VERSION_TAG -f ./cluster/data-job-runner/Dockerfile .
docker push $REPOSITORY/data-job-runner:$VERSION_TAG

# server
pushd cluster/server
docker build -t $REPOSITORY/server:$VERSION_TAG .
docker push $REPOSITORY/server:$VERSION_TAG
popd