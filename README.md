# nstrumenta

Sensor solution platform for acquiring, processing, and visualizing sensor data.

## Components

- **CLI** (`cli/`): Command-line interface for managing projects, modules, data, and agents
- **Server** (`server/`): Backend for authentication, storage, and WebSocket coordination
- **Frontend** (`frontend/`): Angular web app for visualization and management
- **Agent** (`agent/`): Edge runtime for sensor streams and module execution
- **Modules**: User code packages that process sensor data (local or cloud)

## Local Development

Requires a `credentials/local.env` file with `GCLOUD_SERVICE_KEY`.

```shell
# All services with hot-reload and debugger ports
docker compose --env-file=./credentials/local.env up --build

# Server only
docker compose --env-file=./credentials/local.env up --build server

# Without agent
docker compose --env-file=./credentials/local.env up --build --scale agent=0

# Production mode (no debuggers)
docker compose --env-file=./credentials/local.env -f docker-compose.yml up
      - ../../../Taner-Y-Banth/capture/:/capture
```
