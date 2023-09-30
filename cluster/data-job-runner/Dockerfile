FROM node:20.8-bullseye-slim

# curl
RUN apt-get -y update; apt-get -y install curl
RUN apt-get install -y gnupg

# install gcloud
WORKDIR /tmp
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg  add - && apt-get update -y && apt-get install google-cloud-sdk -y

#install jq
RUN apt-get install jq -y

# fuse (for gcsfuse)
RUN apt-get install fuse -y


# install go
RUN curl -OL https://go.dev/dl/go1.20.5.linux-amd64.tar.gz
RUN tar -C /usr/local -xvf go1.20.5.linux-amd64.tar.gz
ENV PATH="$PATH:/usr/local/go/bin"
ENV GOPATH="/usr/local/go"

#install gcsfuse
RUN go install github.com/googlecloudplatform/gcsfuse@v1.0.1

#install ffmpeg
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