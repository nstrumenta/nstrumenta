#!/bin/bash -e
cd "$(dirname "$0")"
rm -rf ../frontend/dist
rm -rf frontend/playwright-report frontend/test-results
find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +