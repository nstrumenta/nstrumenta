FROM nstrumenta/base:latest

# Install pre-built nstrumenta CLI
COPY nstrumenta-*.tgz /tmp/
RUN npm install -g /tmp/nstrumenta-*.tgz && \
    rm /tmp/nstrumenta-*.tgz

# Install and build server
WORKDIR /app
COPY ./server/app/package*.json ./
RUN npm ci --only=production

COPY ./server/app/tsconfig.json ./
COPY ./server/app/src ./src
RUN npm install typescript @tsconfig/node16 --no-save && \
    npm run build && \
    npm uninstall typescript @tsconfig/node16 && \
    npm cache clean --force

CMD ["node", "dist/index.js"]