FROM node:24.1.0-bookworm-slim

# Build argument to force cache invalidation in CI
ARG CACHE_BUST

# Install system dependencies for Playwright's Chromium browser
RUN apt-get update && \
    apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Run as non-root user for launching browser from Playwright
ARG USERNAME=tester
ARG USER_UID=1001
ARG USER_GID=$USER_UID

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \
  && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
  && apt-get update \
  && apt-get install -y sudo \
  && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
  && chmod 0440 /etc/sudoers.d/$USERNAME \
  && rm -rf /var/lib/apt/lists/*

USER $USERNAME
WORKDIR /home/$USERNAME/nstrumenta

# Copy only package files first for better caching
# Context is top level of nstrumenta repo
COPY --chown=$USERNAME:$USERNAME package*.json ./
COPY --chown=$USERNAME:$USERNAME agent-admin-page/package*.json ./agent-admin-page/
COPY --chown=$USERNAME:$USERNAME cluster/server/app/package*.json ./cluster/server/app/
COPY --chown=$USERNAME:$USERNAME src/vscode-extension/package*.json ./src/vscode-extension/

# Install nstrumenta dependencies (cached unless package files change)
RUN --mount=type=cache,target=/home/$USERNAME/.npm,uid=$USER_UID \
    npm install

# Install Playwright browsers early (cached unless package files change)
# Must be in final image for runtime use (~300MB)
RUN npx playwright install chromium --with-deps

# Now copy source code and build
COPY --chown=$USERNAME:$USERNAME . .
RUN npm run build

# Setup test app directory
WORKDIR /home/$USERNAME/projectRoot/cluster/integration-tests/browser-client/client/app
COPY --chown=$USERNAME:$USERNAME ./cluster/integration-tests/browser-client/client/app/package*.json ./

# Install test app dependencies (cached unless test app package files change)
RUN --mount=type=cache,target=/home/$USERNAME/.npm,uid=$USER_UID \
    npm install

# Copy test app source
COPY --chown=$USERNAME:$USERNAME ./cluster/integration-tests/browser-client/client/app/ ./

# Symlink nstrumenta directly
RUN rm -rf ./node_modules/nstrumenta && \
    ln -s ~/nstrumenta ./node_modules/nstrumenta

# Build the Vite app (Playwright already installed earlier)
RUN npm run build

ENTRYPOINT ["npm", "run", "test"]