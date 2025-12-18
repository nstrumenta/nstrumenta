FROM nstrumenta/base:latest

# Install a simple HTTP server
RUN npm install -g http-server

# Copy the built frontend
COPY frontend/dist /app

WORKDIR /app

# Expose port
ENV PORT=4200
EXPOSE 4200

# Create nstrumentaDeployment.json with environment variable at runtime
# API_URL defaults to http://nstrumenta-server:5999 if not set
CMD echo "{\"apiUrl\": \"${API_URL:-http://nstrumenta-server:5999}\"}" > /app/nstrumentaDeployment.json && \
    http-server -p $PORT -c-1 --cors -P http://localhost:$PORT?
