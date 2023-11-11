FROM node:20.3-bullseye-slim

#install nstrumenta
RUN npm i -g nstrumenta

# context is top level of nstrumenta repo
COPY . /nstrumenta/
WORKDIR /nstrumenta
RUN npm install
RUN npm run build:cli
RUN npm link

COPY ./cluster/integration-tests/cli/client/app/ /app
WORKDIR /app
RUN npm install



ENTRYPOINT ["npm", "run", "test-from-docker-compose"]