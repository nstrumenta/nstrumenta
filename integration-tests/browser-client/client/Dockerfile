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
WORKDIR /home/$USERNAME

# Ensure npm cache directory exists and is writable
RUN mkdir -p /home/$USERNAME/.npm

# Install Playwright browsers early (cached unless package files change)
# Must be in final image for runtime use (~300MB)
RUN npx playwright install chromium --with-deps

# Copy tarball
COPY --chown=$USERNAME:$USERNAME nstrumenta-*.tgz ./nstrumenta.tgz

# Setup test app directory
WORKDIR /home/$USERNAME/projectRoot/integration-tests/browser-client/client/app
COPY --chown=$USERNAME:$USERNAME ./integration-tests/browser-client/client/app/ ./

RUN rm -rf package-lock.json node_modules

# Install nstrumenta from tarball (updates package.json) and then other dependencies
RUN npm install /home/tester/nstrumenta.tgz && npm install

# Build the Vite app
RUN npm run build

ENTRYPOINT ["npm", "run", "test-from-docker-compose"]