---
description: Testing Best Practices and Guidelines
globs: *.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx, __tests__/*, cypress/*
alwaysApply: false
---
# Testing Best Practices and Guidelines

## General Testing
- Write tests for all components
- Test user interactions
- Test edge cases
- Test error scenarios
- Test accessibility
- Use proper test data
- Keep tests maintainable

## Unit Testing
- Test individual functions
- Mock external dependencies
- Test return values
- Test error handling
- Use descriptive test names
- Keep tests focused
- Test both happy and sad paths

## Integration Testing
- Test component interactions
- Test API endpoints
- Test database operations
- Test authentication flows
- Test payment processing
- Test webhook handling
- Test third-party integrations

## Payment Provider Testing
- **ALWAYS** test complete data flow: Provider API → Import → Database → Service → UI
- Create debug scripts for each provider (e.g., `debug-{provider}-api-test.ts`)
- Test with real provider data, not just mock data
- Verify field mapping between provider responses and database storage
- Test admin UI displays correctly after import
- Validate backward compatibility with existing payment data
- Test error scenarios (API failures, invalid data, network issues)
- Example debug script pattern:
  ```typescript
  // debug-polar-import-test.ts
  const importStats = await polarProvider.importPayments();
  const payments = await PaymentService.getUsersWithPayments();
  console.log("Import stats:", importStats);
  console.log("Sample payment data:", payments[0]);
  // Verify orderId is populated correctly
  ```

## E2E Testing
- Test complete user journeys
- Test across different browsers
- Test mobile responsiveness
- Test performance scenarios
- Test accessibility compliance
- Use realistic test data
- Test production-like environment

## API Testing
- Test all endpoints
- Test request/response formats
- Test authentication
- Test rate limiting
- Test error responses
- Test data validation
- Test performance

## Database Testing
- Test CRUD operations
- Test data integrity
- Test migrations
- Test performance
- Test concurrency
- Test backup/restore
- Test security constraints

## Frontend Testing
- Test component rendering
- Test user interactions
- Test state management
- Test form validation
- Test responsive design
- Test accessibility
- Test performance

## Test Data Management
- Use factory patterns
- Create realistic test data
- Clean up after tests
- Isolate test data
- Version control test data
- Document test scenarios
- Maintain test data consistency

## Continuous Integration
- Run tests on every commit
- Test multiple environments
- Test different configurations
- Monitor test performance
- Report test coverage
- Handle flaky tests
- Maintain test reliability

## Performance Testing
- Test load scenarios
- Test memory usage
- Test response times
- Test scalability
- Test resource consumption
- Monitor performance trends
- Set performance benchmarks

## Security Testing
- Test authentication
- Test authorization
- Test input validation
- Test data encryption
- Test vulnerability scanning
- Test penetration scenarios
- Regular security audits
