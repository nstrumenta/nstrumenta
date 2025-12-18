#!/bin/bash
set -e

# Simple test runner for frontend MCP tests against a running server

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check required environment variables
if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "Error: FIREBASE_PROJECT_ID not set"
    exit 1
fi

if [ -z "$TEST_USER_EMAIL" ]; then
    echo "Error: TEST_USER_EMAIL not set"
    exit 1
fi

if [ -z "$TEST_USER_PASSWORD" ]; then
    echo "Error: TEST_USER_PASSWORD not set"
    exit 1
fi

# Set defaults
export API_URL=${API_URL:-http://localhost:5999}
export FRONTEND_URL=${FRONTEND_URL:-http://localhost:5008}

echo "Running frontend MCP tests..."
echo "API_URL: $API_URL"
echo "FIREBASE_PROJECT_ID: $FIREBASE_PROJECT_ID"

npm test
