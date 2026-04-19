#!/bin/bash -e
# Manage the local dev stack (server + Angular hot-reload frontend).
# Prerequisites: gh auth login, gcloud auth login
#
# Usage:
#   ./dev.sh        # start the stack
#   ./dev.sh up     # start the stack
#   ./dev.sh down   # tear down the stack
NST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE="docker compose -f $NST_ROOT/integration-tests/docker-compose.dev.yml"
SUBCOMMAND="${1:-up}"

case "$SUBCOMMAND" in
  down)
    $COMPOSE down
    ;;
  up|*)
    source "$NST_ROOT/credentials/activate.sh" || exit 1
    eval "$(cd "$NST_ROOT/integration-tests" && node get-project-config.js)"
    $COMPOSE up -d "${@:2}"
    ;;
esac
