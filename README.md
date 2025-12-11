# nstrumenta

## Sensor Solution Platform

nstrumenta is a comprehensive platform for acquiring, processing, and visualizing sensor data. It enables seamless integration between edge devices and the cloud, providing a robust environment for developing and deploying sensor-driven applications.

### Key Components

- **CLI**: Command-line interface for managing projects, modules, and deployments.
- **Agents**: Lightweight runtimes for edge devices to manage sensor streams and execute modules.
- **Server**: Centralized backend for authentication, data storage, and coordination.
- **Modules**: Containerized units of logic for processing data, running locally or in the cloud.
- **Frontend**: Web-based interface for real-time visualization and management.

## Version 4.0.0

This major release introduces enhanced stability, improved cloud integration, and expanded support for diverse sensor types.

## Local Development

### Start a local nstrumenta stack

Connects to your nstrumenta firebase project.

**Run prod builds without debugger ports:**

```shell
docker compose --env-file=./credentials/local.env -f docker-compose.yml up
```

**Run dev:**

This uses the `docker-compose.override.yml` that runs dev servers and opens debugger ports for attaching (see e.g. `frontend/.vscode/launch.json`).

All services:
```shell
docker compose --env-file=./credentials/local.env up --build
```

No agent:
```shell
docker compose --env-file=./credentials/local.env up --build --scale agent=0
```

Just server:
```shell
docker compose --env-file=./credentials/local.env up --build server
```

### Using the developer machine with a local repository

Add a volume mount to the developer service in `docker-compose.override.yml`:
```yaml
  developer:
    build:
      context: ../
      dockerfile: ./developer/Dockerfile
    privileged: true
    volumes:
      - ../:/nstrumenta
      - ../../../Taner-Y-Banth/capture/:/capture
```
