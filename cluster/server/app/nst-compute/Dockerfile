FROM node:16.6.1-alpine3.14

WORKDIR /app

COPY ./ /app/

RUN npm install -g nstrumenta

EXPOSE 8080

ENTRYPOINT ["nstrumenta", "serve", "--port=8080"]
