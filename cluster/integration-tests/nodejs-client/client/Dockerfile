FROM node:20
# node canvas doesn't have binaries for other versions at the moment
# like https://github.com/Automattic/node-canvas/issues/2188


# context is top level of nstrumenta repo
COPY . /nstrumenta/
WORKDIR /nstrumenta
RUN npm install
RUN npm run build:nodejs

# test package.json has relative path to nstrumenta folder
COPY ./cluster/integration-tests/nodejs-client/client/app /projectRoot/cluster/integration-tests/nodejs-client/client/app/
WORKDIR /projectRoot/cluster/integration-tests/nodejs-client/client/app
RUN npm install


ENTRYPOINT ["npm", "run", "test-from-docker-compose"]