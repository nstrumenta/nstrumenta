FROM google/cloud-sdk:alpine

COPY frontend/dist /app/dist
COPY frontend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
