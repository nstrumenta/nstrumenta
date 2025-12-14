FROM nstrumenta/base:latest

# Install pre-built nstrumenta CLI
COPY nstrumenta-*.tgz /tmp/
RUN npm install -g /tmp/nstrumenta-*.tgz && \
    rm /tmp/nstrumenta-*.tgz

EXPOSE 8088

CMD ["nstrumenta", "agent", "start"]