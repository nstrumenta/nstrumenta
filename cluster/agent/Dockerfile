FROM node:24.1.0-bookworm-slim

# context is top level of nstrumenta repo
COPY . /app/
WORKDIR /app
RUN npm install
RUN npm run build:cli

EXPOSE 8088

CMD ["npx","node","./dist/cli/index.js","agent","start","--no-backplane"]