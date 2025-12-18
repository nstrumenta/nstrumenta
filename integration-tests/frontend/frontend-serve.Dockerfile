FROM nstrumenta/base:latest

# Install a simple HTTP server
RUN npm install -g http-server

# Copy the built frontend
COPY frontend/dist /app

WORKDIR /app

# Expose port
ENV PORT=4200
EXPOSE 4200

# Serve the static files with SPA fallback to index.html
CMD http-server -p $PORT -c-1 --cors -P http://localhost:$PORT?
