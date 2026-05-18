#!/bin/bash -ex

cd "$(dirname "$0")"

CACHE_MODE=${CACHE_MODE:-max}

# agent
docker buildx build \
	--push \
	--cache-from type=registry,ref=$IMAGE_REPOSITORY/agent:buildcache \
	--cache-to type=registry,ref=$IMAGE_REPOSITORY/agent:buildcache,mode=$CACHE_MODE \
	-t $IMAGE_REPOSITORY/agent:$IMAGE_VERSION_TAG \
	-f ./agent/Dockerfile \
	.

# data-job-runner uses nstrumenta/base (no NODE_VERSION arg needed)
docker buildx build \
	--push \
	--cache-from type=registry,ref=$IMAGE_REPOSITORY/data-job-runner:buildcache \
	--cache-to type=registry,ref=$IMAGE_REPOSITORY/data-job-runner:buildcache,mode=$CACHE_MODE \
	-t $IMAGE_REPOSITORY/data-job-runner:$IMAGE_VERSION_TAG \
	-f ./data-job-runner/Dockerfile \
	.

# server (includes frontend static files)
docker buildx build \
	--push \
	--cache-from type=registry,ref=$IMAGE_REPOSITORY/server:buildcache \
	--cache-to type=registry,ref=$IMAGE_REPOSITORY/server:buildcache,mode=$CACHE_MODE \
	-t $IMAGE_REPOSITORY/server:$IMAGE_VERSION_TAG \
	-f ./server/Dockerfile \
	.

# Note: Frontend is no longer a separate image - it's included in the server image
