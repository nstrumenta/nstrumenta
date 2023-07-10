FROM node:20-bullseye

#install nstrumenta
RUN npm i -g nstrumenta

# context is top level of nstrumenta repo
COPY . /nstrumenta/
WORKDIR /nstrumenta
RUN npm install
RUN npm run build
RUN npm link

COPY ./cluster/data-job-runner/app /app
WORKDIR /app
RUN npm i

ENTRYPOINT [ "npm", "run", "start" ]