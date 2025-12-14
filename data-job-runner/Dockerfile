FROM nstrumenta/base:latest

# Install ffmpeg for media processing
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install pre-built nstrumenta CLI
COPY nstrumenta-*.tgz /tmp/
RUN npm install -g /tmp/nstrumenta-*.tgz && \
    rm /tmp/nstrumenta-*.tgz

# Install and build data-job-runner
WORKDIR /app
COPY ./data-job-runner/app/package*.json ./
RUN npm ci --only=production

COPY ./data-job-runner/app/tsconfig.json ./
COPY ./data-job-runner/app/src ./src
RUN npm run build && \
    npm cache clean --force

CMD ["node", "dist/index.js"]