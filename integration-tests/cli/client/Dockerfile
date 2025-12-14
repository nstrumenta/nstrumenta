ARG NODE_VERSION=24.12.0
FROM node:${NODE_VERSION}-bookworm-slim

WORKDIR /app

COPY ./integration-tests/cli/client/app/ .
COPY nstrumenta-*.tgz ./nstrumenta.tgz

# Install nstrumenta from the tarball globally so 'nst' command is available
RUN npm install -g ./nstrumenta.tgz

RUN rm -rf package-lock.json node_modules
RUN npm install

ENTRYPOINT ["npm", "run", "test-from-docker-compose"]