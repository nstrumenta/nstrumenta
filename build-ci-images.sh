#!/bin/bash -ex

cd "$(dirname "$0")"

# Agent uses official Node.js image with ARG
NODE_VERSION=24.12.0

# agent
docker build --build-arg NODE_VERSION=$NODE_VERSION -t $IMAGE_REPOSITORY/agent:$IMAGE_VERSION_TAG -f ./agent/Dockerfile .
docker push $IMAGE_REPOSITORY/agent:$IMAGE_VERSION_TAG

# data-job-runner uses nstrumenta/base (no NODE_VERSION arg needed)
docker build -t $IMAGE_REPOSITORY/data-job-runner:$IMAGE_VERSION_TAG -f ./data-job-runner/Dockerfile .
docker push $IMAGE_REPOSITORY/data-job-runner:$IMAGE_VERSION_TAG

# server
docker build -t $IMAGE_REPOSITORY/server:$IMAGE_VERSION_TAG -f ./server/Dockerfile .
docker push $IMAGE_REPOSITORY/server:$IMAGE_VERSION_TAG