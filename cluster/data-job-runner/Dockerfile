ARG BASE_TAG=latest
FROM nstrumenta/toolchain:${BASE_TAG}

#install ffmpeg
RUN apt-get -y update --allow-releaseinfo-change
RUN apt-get install -y ffmpeg

#install nstrumenta
RUN npm i -g nstrumenta
# context is top level of nstrumenta repo
COPY . /nstrumenta/
WORKDIR /nstrumenta
RUN npm install
RUN npm run build:cli
RUN npm link

COPY ./cluster/data-job-runner/app /app
WORKDIR /app
RUN npm i
RUN npm run build

CMD [ "node", "dist/index.js" ]