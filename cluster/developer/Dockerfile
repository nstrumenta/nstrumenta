ARG BASE_TAG=latest
FROM nstrumenta/toolchain:${BASE_TAG}

# context is top level of nstrumenta repo
COPY . /nstrumenta/
WORKDIR /nstrumenta
RUN npm install
RUN npm run build:cli
RUN echo 'alias nst="node /nstrumenta/dist/cli/index.js"' >> ~/.bashrc
RUN echo 'alias nstrumenta="node /nstrumenta/dist/cli/index.js"' >> ~/.bashrc
RUN mkdir /workspace
WORKDIR /workspace