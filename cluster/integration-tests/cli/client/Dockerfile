FROM node:20.3-bullseye-slim

# context is top level of nstrumenta repo
COPY . /nstrumenta/
WORKDIR /nstrumenta
RUN npm install
RUN npm run build:cli
RUN echo 'alias nst="node /nstrumenta/dist/cli/index.js"' >> ~/.bashrc
RUN echo 'alias nstrumenta="node /nstrumenta/dist/cli/index.js"' >> ~/.bashrc

COPY ./cluster/integration-tests/cli/client/app/ /app
WORKDIR /app
RUN npm install



ENTRYPOINT ["npm", "run", "test-from-docker-compose"]