FROM nstrumenta/base:latest

# Copy the built frontend
COPY frontend/dist /app

# Copy proxy server script and package.json
COPY integration-tests/frontend/server.js /app/server.js
COPY integration-tests/frontend/proxy-package.json /app/package.json

WORKDIR /app

# Install dependencies locally
RUN npm install

# Expose port
ENV PORT=4200
ENV API_URL=http://nstrumenta-server:5999
EXPOSE 4200

# Start Express server with proxy
CMD node server.js
