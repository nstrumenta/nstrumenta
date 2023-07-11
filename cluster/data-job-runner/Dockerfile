FROM node:20.3-bullseye-slim

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
RUN go install github.com/googlecloudplatform/gcsfuse@master

#install docker
RUN install -m 0755 -d /etc/apt/keyrings
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
RUN chmod a+r /etc/apt/keyrings/docker.gpg
RUN echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update
RUN apt-get install -y docker-ce=5:24.0.0-1~debian.11~bullseye  docker-ce-cli=5:24.0.0-1~debian.11~bullseye containerd.io docker-buildx-plugin docker-compose-plugin

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