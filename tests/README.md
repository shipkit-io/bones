# Testing in Shipkit

This directory contains tests for the Shipkit application. The test suite is organized into different categories:

## Directory Structure

- `unit/`: Unit tests for individual functions and components
  - `utils/`: Tests for utility functions
  - `server/`: Tests for server-side code
- `e2e/`: End-to-end tests
- `browser/`: Browser-specific tests
- `node/`: Node.js-specific tests

## Test Commands

```bash
# Run all unit tests
bun run test

# Run Node.js specific tests
bun run test:node

# Run browser tests
bun run test:browser

# Run specific test file
bun run test tests/unit/utils/standalone-test.test.ts

# Run tests with coverage
bun run test:coverage
```

## Test Structure

- `unit/`: Unit tests for functions and components that run in jsdom environment
- `node/`: Tests that require Node.js environment (e.g., server components, API routes)
- `browser/`: Tests that need a real browser environment via Playwright
- `e2e/`: End-to-end tests with Playwright

## Environment Setup

Our test setup minimizes mocking while ensuring tests run reliably:

- `setup-env.ts`: Loads environment variables properly in both Node.js and browser environments
- `setup.ts`: Contains minimal required mocks for testing React components
- `utils.tsx`: Provides testing utilities including custom render functions with providers

### Environment Variables

Tests use a unified approach to environment variables that works in both Node.js and browser environments:

- In Node.js tests, environment variables are loaded using Next.js's own `loadEnvConfig` from `@next/env`
- In browser tests, environment variables are automatically processed at build time
- The test environment sets `NODE_ENV=test` to ensure proper loading of `.env.test` files

Create a `.env.test` file to define test-specific variables that won't affect your production environment.

## Adding Tests

1. Identify the appropriate test directory based on your test's requirements:
   - Regular component or utility tests go in `unit/`
   - Server component or API tests go in `node/`
   - Tests requiring a real browser go in `browser/`
   - Full end-to-end testing scenarios go in `e2e/`

2. Write focused tests that:
   - Test functionality, not implementation details
   - Are independent of other tests
   - Don't rely on external services (use minimal mocks if needed)

## Testing Approach

### Unit Tests

Unit tests focus on testing individual functions and components in isolation. They are the easiest to write and maintain, and provide the most value for the least amount of effort.

Some key principles for unit tests:

- Each test should be independent and not rely on the state of other tests
- Tests should be fast and not require external services
- Focus on testing the most important logic and edge cases

### Environment Handling

Tests use Next.js's built-in `loadEnvConfig` from `@next/env` to load environment variables, ensuring consistent behavior with the actual application.

- During tests, NODE_ENV is set to "test"
- Environment variables are loaded in the following order:
  1. process.env
  2. .env.test.local
  3. .env.test
  4. .env

For browser-specific tests (`bun run test:browser`), the browser environment is set up with Playwright and the same environment variables are available.

For Node.js-specific tests (`bun run test:node`), tests run in a Node environment with access to the same environment variables.

### Adding New Tests

1. Look for self-contained utility functions that don't require mocks
2. Write tests focusing on different input/output combinations
3. Test edge cases and error handling
4. For components, focus on rendering behavior and not implementation details

## Mocking Approach

- Tests that would normally interact with the database use `safeDbExecute` to gracefully handle missing database connections
- Environment variables are handled with test-specific utilities
- External services are mocked to avoid making actual API calls

## Areas for Additional Testing

- React components (both server and client)
- API endpoints
- Authentication flows
- Data fetching utilities
- Server actions
