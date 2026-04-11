# nstrumenta

Sensor solution platform for acquiring, processing, and visualizing sensor data.

## Components

- **CLI** (`cli/`): Command-line interface for managing projects, modules, data, and agents
- **Server** (`server/`): Node.js/Express backend with Firebase Admin SDK, Cloud Run API, and WebSocket coordination
- **Frontend** (`frontend/`): Angular web app for visualization and management
- **Agent** (`agent/`): Edge runtime for sensor streams and module execution
- **Modules**: User code packages that process sensor data (local or cloud)

## Prerequisites

- Node.js >= 18
- Docker (for local stack)
- `gcloud` CLI (for initial auth only -- not used by the server at runtime)

```shell
gcloud auth application-default login
gcloud config set project <your-gcp-project-id>
```

## Local Development

We strictly avoid `.env` files (e.g., `local.env`) for local development to prevent secret sniffing and accidental leakage. Instead, we securely fetch secrets from GitHub or GCP directly into memory.

```shell
# Authenticate with GitHub to fetch secrets dynamically
gh auth login

# Activate credentials dynamically (fetches from gh secrets/variables into env)
source credentials/activate.sh

# All services with hot-reload and debugger ports
docker compose up --build

# Server only
docker compose up --build server

# Without agent
docker compose up --build --scale agent=0

# Production mode (no debuggers, no hot-reload)
docker compose -f docker-compose.yml up --build
```

## Build

```shell
npm run build          # All packages
npm run build:server   # Server only
npm run build:frontend # Frontend only
```

## Test

```shell
npm test               # Unit tests (client + server + frontend)
npm run test:e2e       # Integration tests against local server
```

## Infrastructure

All infrastructure is managed by Terraform. See [terraform/readme.md](terraform/readme.md).

CI/CD runs on GitHub Actions (`.github/workflows/ci.yml`).

