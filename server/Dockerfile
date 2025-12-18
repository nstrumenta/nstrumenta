FROM nstrumenta/base:latest

# Install pre-built nstrumenta CLI
COPY build/nstrumenta-*.tgz /tmp/nstrumenta.tgz
RUN npm install -g /tmp/nstrumenta.tgz && \
    rm /tmp/nstrumenta.tgz

# Install pre-built server app
COPY build/nst-server-*.tgz /tmp/nst-server.tgz
RUN npm install -g /tmp/nst-server.tgz && \
    rm /tmp/nst-server.tgz

CMD ["nst-server"]