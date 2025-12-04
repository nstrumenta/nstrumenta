# Docker Build Caching Strategy for Integration Tests

## Overview

The integration test Dockerfiles are optimized for efficient layer caching while ensuring CI always rebuilds from scratch.

## Caching Improvements

### 1. **Layer Ordering for Maximum Cache Reuse**

Instead of copying all source files first, we now:

```dockerfile
# ❌ OLD: Cache invalidated on ANY file change
COPY . /app/
RUN npm install

# ✅ NEW: Cache invalidated only when package files change
COPY package*.json ./
RUN npm install
COPY . .
```

This means `npm install` is cached unless `package.json` or `package-lock.json` changes.

### 2. **BuildKit Cache Mounts**

Using `--mount=type=cache` to persist npm cache across builds:

```dockerfile
# npm cache persisted between builds (speeds up npm install)
RUN --mount=type=cache,target=/home/tester/.npm,uid=1001 \
    npm install
```

**Note**: Playwright browsers are installed directly into the image (not via cache mount) because they need to be present at runtime. However, Docker layer caching means this step is only re-run when the layers before it change.

### 3. **Separate Package File Copies**

For multi-package repos, copy all package files first:

```dockerfile
COPY package*.json ./
COPY agent-admin-page/package*.json ./agent-admin-page/
COPY cluster/server/app/package*.json ./cluster/server/app/
COPY src/vscode-extension/package*.json ./src/vscode-extension/
RUN npm install
```

### 4. **CI vs Local Development**

```dockerfile
# Build argument to force cache invalidation
ARG CACHE_BUST
```

- **Local development**: Omit `CACHE_BUST` → full caching enabled
- **CI**: Pass `CACHE_BUST=$(date +%s)` → forces rebuild

The `ci.sh` script automatically detects CI environment and passes the argument.

## Cache Layers

### Browser-Client Dockerfile
1. Base image + system packages (rarely changes)
2. User creation (rarely changes)
3. npm dependencies (changes when package*.json changes)
4. Playwright browsers (~300MB, cached when npm deps stable)
5. Source code + build (changes frequently)
6. Test app dependencies (changes when test package*.json changes)
7. Test app source + build (changes frequently)

### Agent Dockerfile
1. Base image (rarely changes)
2. npm dependencies (changes when package.json changes)
3. Source code + build (changes frequently)

## Benefits

### Local Development
- **~10x faster rebuilds** when only source code changes
- **Playwright browsers not re-downloaded** (saves 3-4 minutes)
- **npm install skipped** when package files unchanged (saves 20-30 seconds)

### CI
- Still rebuilds everything from scratch
- Uses cache mounts for faster npm installs
- Deterministic builds

## Usage

### Local Development (with caching)
```bash
cd cluster/integration-tests
./ci.sh browser-client
```

### CI Environment (force rebuild)
```bash
export CI=true
cd cluster/integration-tests
./ci.sh browser-client
```

**Note**: The CircleCI config automatically sets `CI=true` before running integration tests to ensure clean builds.

### Manual Cache Control
```bash
# Force rebuild locally
docker compose build --no-cache

# Use cache in CI (not recommended)
unset CI
./ci.sh browser-client
```

## Testing the Cache Strategy

To verify caching is working:

```bash
# First build (cold cache)
time ./ci.sh browser-client

# Second build (warm cache, no code changes)
time ./ci.sh browser-client

# Should be significantly faster!
```

## BuildKit Requirement

These optimizations require Docker BuildKit. Enable it:

```bash
export DOCKER_BUILDKIT=1
# or add to ~/.docker/config.json
```

BuildKit is enabled by default in Docker Desktop and recent Docker versions.
