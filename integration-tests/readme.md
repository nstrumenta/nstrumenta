# Integration Tests

End-to-end tests for CLI, agents, and web features using Docker Compose.

## Running Tests

```shell
# Run all tests with local credentials
ENVFILE=../credentials/local.env ./e2e.sh

# Run specific test suite
ENVFILE=../credentials/local.env ./e2e.sh cli
```

Tests are written with Vitest. Each subfolder contains a `docker-compose.yml` that spins up the necessary services.
