FROM --platform=linux/amd64 node:20-bullseye

# install Temporal CLI
COPY install-assets temporal/install-assets
COPY config temporal/config
COPY start-server.sh start-server.sh
RUN chmod +x start-server.sh
RUN mkdir -p /root/temporal/bin
RUN tar -zxvf temporal/install-assets/temporal_cli_0.7.0_linux_amd64.tar.gz -C /root/temporal/bin
ENV PATH "$PATH:/root/temporal/bin"

ENTRYPOINT ["./start-server.sh"]