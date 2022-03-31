FROM node:16.14-alpine3.15

# build docker image with nstrumenta installed, pinned to a version supplied in build-args
# e.g., docker build --build-arg nstrumenta_version=2.1.3 -t nstrumenta:2.1.13 .
ARG nstrumenta_version

ENV USER=node
ENV PATH="/home/node/.npm-global/bin:${PATH}"
ENV NPM_CONFIG_PREFIX="/home/node/.npm-global"

USER "${USER}"
RUN mkdir -p "${NPM_CONFIG_PREFIX}/lib"

WORKDIR /usr/src/app

# make sure npm modules are installed where permissions allow i/o of config files (needed for packacke 'conf')
RUN npm --global config set user "${USER}"

RUN echo "user=node" > "${NPM_CONFIG_PREFIX}/etc/.npmrc"
RUN npm install -g nstrumenta@${nstrumenta_version}
