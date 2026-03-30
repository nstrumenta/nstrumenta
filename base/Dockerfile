# nstrumenta/base - Minimal CI/CD image
# Node.js LTS + essential tools for building and testing
# Used by: CI build/test jobs, server, agent, data-job-runner

FROM node:24.12.0-bookworm-slim

RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    jq \
    zip \
    ca-certificates \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /usr/lib/python*/EXTERNALLY-MANAGED \
    && python3 -m pip install --upgrade setuptools

RUN node --version && \
    npm --version && \
    git --version && \
    jq --version && \
    python3 --version

LABEL org.opencontainers.image.source="https://github.com/nstrumenta/nstrumenta"
LABEL org.opencontainers.image.description="nstrumenta/base: Node.js LTS with minimal build/test tools"
