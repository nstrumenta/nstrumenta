FROM node:20

WORKDIR /app

# Copy the test app
COPY ./integration-tests/nodejs-client/client/app .

# Copy the packed tarball from the root context
COPY nstrumenta-*.tgz ./nstrumenta.tgz

RUN rm -rf package-lock.json node_modules

# Install nstrumenta from tarball (updates package.json) and then other dependencies
RUN npm install ./nstrumenta.tgz && npm install

ENTRYPOINT ["npm", "run", "test-from-docker-compose"]