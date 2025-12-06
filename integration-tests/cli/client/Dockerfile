FROM node:24.1.0-bookworm-slim

WORKDIR /app

COPY ./integration-tests/cli/client/app/ .
COPY nstrumenta-*.tgz ./nstrumenta.tgz

# Install nstrumenta from the tarball globally so 'nst' command is available
RUN npm install -g ./nstrumenta.tgz

RUN rm -rf package-lock.json node_modules
RUN npm install

ENTRYPOINT ["npm", "run", "test-from-docker-compose"]