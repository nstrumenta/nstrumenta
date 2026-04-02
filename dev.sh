#!/bin/bash -e
# Start the local dev stack (server + Angular hot-reload frontend).
# Prerequisites: gh auth login, gcloud auth login
NST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$NST_ROOT/credentials/activate.sh"
eval "$(cd "$NST_ROOT/integration-tests" && node get-project-config.js)"

docker compose -f "$NST_ROOT/integration-tests/docker-compose.dev.yml" up -d "$@"
