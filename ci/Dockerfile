# nstrumenta/ci - CI test runner image
# Extends nstrumenta/base with Playwright + Chromium for e2e browser tests
# Version pin must match @playwright/test in integration-tests/frontend/package.json

FROM nstrumenta/base:latest

RUN npx --yes playwright@1.50.1 install --with-deps chromium

RUN chromium --version 2>/dev/null || google-chrome --version 2>/dev/null || true

LABEL org.opencontainers.image.source="https://github.com/nstrumenta/nstrumenta"
LABEL org.opencontainers.image.description="nstrumenta/ci: CI test runner with Playwright and Chromium"
