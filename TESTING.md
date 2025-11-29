# Testing Guide

Testing conventions and best practices for the nstrumenta monorepo.

## Naming Conventions

### Backend (TypeScript/Node.js)

**Test directory:** `__tests__/` (double underscores)  
**Test files:** `camelCase.test.ts`  
**Location:** Co-located with source or in `__tests__` directory

Examples:
```
src/nodejs/__tests__/mcp.test.ts
cluster/server/app/src/oauth.test.ts
cluster/server/app/src/__tests__/rateLimiter.test.ts
```

Use `__tests__` directory when testing internal implementation details, grouping related tests, or when the test filename needs context. Co-locate when testing a single module or public API.

### Frontend (Angular)

**Test files:** `kebab-case.component.spec.ts` or `kebab-case.service.spec.ts`  
**Location:** Co-located with components/services

Examples:
```
cluster/frontend/src/app/components/toolbar/toolbar.component.spec.ts
cluster/frontend/src/app/services/project.service.spec.ts
```

### Python

**Test directory:** `tests/` (single word)  
**Test files:** `test_snake_case.py`

## Test Frameworks

**Backend:** Vitest (configured in `package.json`)  
**Frontend:** Karma + Jasmine (configured in `angular.json`)

## Test Naming

**Describe blocks:** Use feature or component name in plain English
```typescript
describe('Rate Limiter', () => { ... })
describe('OAuth Authorization', () => { ... })
```

**Test cases:** Start with `should` + verb + specific outcome
```typescript
it('should track request counts per IP', () => { ... })
it('should block requests exceeding limit', () => { ... })
```

**Variables:** Use descriptive camelCase names
```typescript
const requestCounts = new Map()
const mcpLimiter = rateLimiter(15 * 60 * 1000, 50)
const authResult = await auth(req, res)
```

Avoid: snake_case in TypeScript, vague names, generic descriptions

## Directory Structure

**TypeScript:**
```
src/
├── module.ts
├── module.test.ts              # Co-located
└── __tests__/                  # Grouped tests
    ├── helpers.test.ts
    └── integration.test.ts
```

**Python:**
```
src/python/
├── module.py
└── tests/
    └── test_module.py
```

## Test File Structure

```typescript
// Imports
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mocks
vi.mock('./dependency', () => ({ dependency: vi.fn() }))

// Tests
describe('Module Name', () => {
  beforeEach(() => { /* setup */ })
  
  it('should do something', () => {
    // Arrange
    const input = 'test'
    // Act
    const result = functionUnderTest(input)
    // Assert
    expect(result).toBe('expected')
  })
})
```

## Test Types

### Unit Tests
- Test individual functions/modules in isolation
- Mock external dependencies
- Fast execution
- Location: Co-located or `__tests__/`

### Integration Tests
- Test multiple components working together
- May use real dependencies (databases, APIs)
- Slower execution
- Location: `cluster/integration-tests/`

### Example patterns:
## Test Types

**Unit tests:** Test individual functions with mocked dependencies. Fast, isolated.  
**Integration tests:** Test multiple components with real dependencies. Slower, end-to-end.test --watch       # Watch mode
```

### Integration Tests
```bash
cd cluster/integration-tests/cli
npm test
```

## Best Practices

1. **Follow AAA pattern:** Arrange, Act, Assert
2. **Test one thing per test:** Each test validates a single behavior
3. **Use descriptive names:** Tests should read like documentation
4. **Mock external dependencies:** Keep unit tests isolated and fast
5. **Clean up resources:** Use `afterEach` to prevent test pollution
6. **Avoid magic numbers:** Use named constants with comments

## Common Patterns

**Express middleware:**
```typescript
it('should call next() when validation passes', () => {
  const req = { body: { valid: true } } as Request
  const next = vi.fn()
  validateMiddleware(req, {} as Response, next)
  expect(next).toHaveBeenCalled()
})
```

**Async functions:**
```typescript
it('should fetch data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})
```

**Error cases:**
```typescript
it('should throw error for invalid input', () => {
  expect(() => parseInput('invalid')).toThrow('Invalid format')
})
```

## Checklist

- File naming follows conventions (camelCase backend, kebab-case Angular)
- Test names use "should" pattern with plain English
- Each test covers one specific behavior
- Tests are isolated and independent
- External dependencies are mocked
- Resources cleaned up in `afterEach`
- Variables use camelCase (no snake_case)
- Tests pass consistently: `npm test`