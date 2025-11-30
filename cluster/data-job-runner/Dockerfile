ARG BASE_TAG=latest
FROM nstrumenta/toolchain:${BASE_TAG}

#install ffmpeg
RUN apt-get -y update --allow-releaseinfo-change
RUN apt-get install -y ffmpeg curl gnupg lsb-release

# install gcsfuse
RUN export GCSFUSE_REPO=gcsfuse-`lsb_release -c -s` \
    && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt $GCSFUSE_REPO main" | tee /etc/apt/sources.list.d/gcsfuse.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg \
    && apt-get update \
    && apt-get install -y gcsfuse fuse

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