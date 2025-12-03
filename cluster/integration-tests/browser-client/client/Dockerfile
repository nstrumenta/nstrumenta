FROM node:24.1.0-bookworm-slim

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

# Copy nstrumenta and change owner
# Context is top level of nstrumenta repo
COPY . /home/$USERNAME/nstrumenta/
RUN chown -R $USERNAME:$USERNAME /home/$USERNAME/nstrumenta

# Copy test app
COPY ./cluster/integration-tests/browser-client/client/app /home/$USERNAME/projectRoot/cluster/integration-tests/browser-client/client/app/
RUN chown -R $USERNAME:$USERNAME /home/$USERNAME/projectRoot

USER $USERNAME

# Install nstrumenta
WORKDIR /home/$USERNAME/nstrumenta
RUN npm install
RUN npm run build

# Install test app
WORKDIR /home/$USERNAME/projectRoot/cluster/integration-tests/browser-client/client/app
RUN npm install

# Symlink nstrumenta directly
RUN rm -rf ./node_modules/nstrumenta
RUN ln -s ~/nstrumenta ./node_modules/nstrumenta

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Build the Vite app
RUN npm run build

ENTRYPOINT ["npm", "run", "test"]