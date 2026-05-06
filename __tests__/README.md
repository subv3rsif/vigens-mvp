# Vigens Testing Guide

This document explains the testing infrastructure for the Vigens MVP.

## Overview

The project uses two testing frameworks:
- **Vitest + React Testing Library** for unit and component tests
- **Playwright** for end-to-end (E2E) tests

## Quick Start

```bash
# Run all unit/component tests
npm run test

# Run tests in watch mode (during development)
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Unit & Component Tests

### Structure

```
__tests__/
├── components/        # Component tests
│   ├── task-card.test.tsx
│   ├── kanban-column.test.tsx
│   └── project-card.test.tsx
└── hooks/            # Hook tests
    └── use-projects.test.tsx
```

### Writing Component Tests

Component tests verify that UI components render correctly and respond to user interactions:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<MyComponent onClick={onClick} />)

    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

### Writing Hook Tests

Hook tests verify custom React hooks work correctly:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMyHook } from './useMyHook'

describe('useMyHook', () => {
  it('provides expected interface', () => {
    const { result } = renderHook(() => useMyHook(), {
      wrapper: createWrapper(), // Provides QueryClient
    })

    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('isLoading')
  })
})
```

## E2E Tests

### Structure

```
e2e/
├── auth.spec.ts       # Authentication flows
├── projects.spec.ts   # Project CRUD operations
└── kanban.spec.ts     # Kanban board interactions
```

### Writing E2E Tests

E2E tests verify the entire application flow from the user's perspective:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature')
  })

  test('completes user flow', async ({ page }) => {
    await page.getByRole('button', { name: /action/i }).click()
    await expect(page.getByText(/success/i)).toBeVisible()
  })
})
```

## Mocking

### Automatic Mocks

The following are automatically mocked in all tests:
- Next.js navigation (`useRouter`, `usePathname`, etc.)
- Next.js Link component
- Supabase client
- Sonner toast notifications
- @dnd-kit drag and drop

### Custom Mocks

To add a custom mock for a specific test:

```typescript
vi.mock('../../lib/my-module', () => ({
  myFunction: vi.fn().mockReturnValue('mocked value'),
}))
```

## Test Coverage

Generate a coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory. Aim for:
- **80%+ line coverage** for critical features
- **70%+ line coverage** overall

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

See `.github/workflows/test.yml` for CI configuration.

## Best Practices

### Component Tests

1. **Test user behavior, not implementation**
   - Use `screen.getByRole()` over `getByClassName()`
   - Test what users see and do

2. **Keep tests simple and focused**
   - One assertion per test when possible
   - Use descriptive test names

3. **Clean up after tests**
   - Tests automatically clean up with `afterEach(cleanup)`

### E2E Tests

1. **Test critical user paths**
   - Focus on main features: auth, projects, tasks
   - Test happy paths and common error scenarios

2. **Use test data wisely**
   - Create test data in `beforeEach` hooks
   - Clean up test data after tests

3. **Wait for elements properly**
   - Use `await expect(...).toBeVisible()`
   - Don't use arbitrary timeouts

## Troubleshooting

### Tests fail locally but pass in CI

- Ensure you have the latest dependencies: `npm ci`
- Check for environment-specific issues (file paths, etc.)

### Playwright tests timing out

- Increase timeout in `playwright.config.ts`
- Check if dev server is running on correct port

### Mock not working

- Ensure mock is defined before importing tested module
- Clear mocks between tests with `vi.clearAllMocks()`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
