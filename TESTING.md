# Testing Guide

## Naming Conventions

### Backend (TypeScript)

- **Directory:** `__tests__/`
- **Files:** `camelCase.test.ts`
- **Framework:** Vitest

### Frontend (Angular)

- **Files:** `kebab-case.component.spec.ts`
- **Framework:** Karma + Jasmine

### Python

- **Directory:** `tests/`
- **Files:** `test_snake_case.py`

## Running Tests

```shell
# All unit tests (client + server + frontend)
npm test

# Server tests only
cd server/app && npm test

# Frontend tests only
cd frontend && npm test

# Integration tests (requires a running server)
npm run test:e2e          # All suites
npm run test:e2e:cli      # CLI tests only
npm run test:e2e:frontend # MCP/frontend tests only
```

Integration tests run directly against a server URL (default `http://localhost:5999`). Set `API_URL` to point at a different server.

## Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => { /* setup */ })
  
  it('should do something specific', () => {
    // Arrange, Act, Assert
  })
})
```
