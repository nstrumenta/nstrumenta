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
# All backend tests
npm test

# Server tests
cd server/app && npm test

# Frontend tests
cd frontend && npm test

# Integration tests
cd integration-tests && ENVFILE=../credentials/local.env ./e2e.sh
```

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
