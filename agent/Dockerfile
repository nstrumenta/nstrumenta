FROM node:24.1.0-bookworm-slim

# Build argument to force cache invalidation in CI
ARG CACHE_BUST

WORKDIR /app

# Copy only package files first for better caching
# Context is top level of nstrumenta repo
COPY package*.json ./

# Install dependencies (cached unless package.json changes)
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy source code and build
COPY . .
RUN npm run build:cli

EXPOSE 8088

CMD ["npx","node","./dist/cli/index.js","agent","start"]