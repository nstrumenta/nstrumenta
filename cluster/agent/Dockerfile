FROM node:20.3-bullseye-slim

# context is top level of nstrumenta repo
COPY . /app/
WORKDIR /app
RUN npm install
RUN npm run build:cli

EXPOSE 8088

CMD ["npm","run","start:agent"]