FROM nstrumenta/base:latest

WORKDIR /build

COPY package*.json ./
COPY lib/ ./lib/
COPY cli/ ./cli/
COPY browser/ ./browser/
COPY agent/ ./agent/
COPY agent-admin-page/ ./agent-admin-page/
COPY server/server.ts ./server/server.ts
RUN npm install --quiet
RUN npm run build:lib && npm run build:cli && npm run build:browser
RUN npm pack && npm install -g nstrumenta-*.tgz

EXPOSE 8088
CMD ["nstrumenta", "agent", "start"]
