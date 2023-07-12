FROM node:16.13.2-alpine3.15

WORKDIR /app

COPY ./app/ /app/

RUN npm install

ENTRYPOINT ["npm", "run", "test-from-docker-compose"]