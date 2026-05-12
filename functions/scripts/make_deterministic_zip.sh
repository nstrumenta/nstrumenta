#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE_DIR="$ROOT_DIR/.zip-stage"
OUTPUT_ZIP="$ROOT_DIR/../terraform/storageObjectFunctions.zip"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"
rm -f "$OUTPUT_ZIP"

cp -R "$ROOT_DIR/src" "$STAGE_DIR/src"
cp "$ROOT_DIR/index.ts" "$STAGE_DIR/index.ts"
cp "$ROOT_DIR/tsconfig.json" "$STAGE_DIR/tsconfig.json"
cp "$ROOT_DIR/package.json" "$STAGE_DIR/package.json"
cp "$ROOT_DIR/package-lock.json" "$STAGE_DIR/package-lock.json"

# Use a fixed timestamp to keep zip metadata deterministic.
find "$STAGE_DIR" -exec touch -t 202001010000 {} +

(
  cd "$STAGE_DIR"
  find . -type f | LC_ALL=C sort | zip -X -q "$OUTPUT_ZIP" -@
)

rm -rf "$STAGE_DIR"
