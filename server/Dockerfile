FROM nstrumenta/base:latest

WORKDIR /build

# Build CLI
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

# Build server
COPY server/app/ ./server/app/
RUN cd server/app && npm ci --quiet && npm run build && npm pack && npm install -g nst-server-*.tgz

# Copy pre-built frontend
COPY frontend/dist /app/frontend

CMD ["nst-server"]