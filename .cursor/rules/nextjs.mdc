---
description: Next.js Best Practices and Guidelines
globs: *.ts, *.tsx, app/*, pages/*, src/app/*, src/pages/*
alwaysApply: false
---

# Next.js Best Practices

`params` should be awaited before using its properties.
`searchParams` should be awaited before using its properties.
`headers` should be awaited before using its properties.

## Server Components
- Use Server Components by default
- Keep client components minimal
- Don't nest server in client components
- Use proper data fetching patterns
- Implement proper caching strategies
- Handle streaming and suspense
- Consider SEO implications

## Data Fetching
- Use Server Components for data fetching
- Don't fetch data in Server Actions
- Implement proper caching
- Handle loading states
- Consider revalidation strategies
- Use proper error boundaries
- Optimize for performance

## Server Actions
- Use for data mutations only
- Keep business logic in services
- Implement proper validation
- Handle errors gracefully
- Use proper typing
- Consider optimistic updates
- Document side effects

## Routing
- Use App Router
- Implement proper layouts
- Handle dynamic routes properly
- Use proper loading UI
- Implement error boundaries
- Consider parallel routes
- Handle intercepting routes

## State Management
- Use Server Components when possible
- Keep client state minimal
- Use hooks appropriately
- Implement proper caching
- Consider server state
- Handle revalidation
- Document state flow

## Performance
- Use proper image optimization
- Implement proper caching
- Consider bundle size
- Use proper code splitting
- Implement proper loading states
- Monitor performance metrics
- Optimize for Core Web Vitals

## Security
- Implement proper authentication
- Use proper authorization
- Handle CSRF protection
- Implement proper headers
- Use environment variables
- Handle sensitive data
- Regular security audits

## Error Handling
- Use error boundaries
- Implement proper logging
- Handle API errors
- Consider recovery strategies
- Document error scenarios
- Monitor error rates
- Implement proper fallbacks

## Testing
- Test Server Components
- Test Server Actions
- Implement E2E tests
- Consider integration tests
- Test error scenarios
- Monitor test coverage
- Document test strategy

## Deployment
- Use proper build process
- Implement proper CI/CD
- Consider staging environments
- Monitor deployment health
- Handle rollbacks
- Document deployment process
- Regular deployment audits

## Multi-Zone Configuration
- Configure `basePath` and `assetPrefix` for each zone
- Use rewrites in main app to route to zones
- Configure environment variables for zone domains
- Use anchor tags for cross-zone navigation (not Next.js Link)
- Implement proper zone-specific optimization
- Test cross-zone functionality thoroughly
- Document zone architecture

## Code Organization
- Follow App Router conventions
- Keep route handlers clean
- Separate concerns properly
- Use proper middleware
- Implement proper layouts
- Handle metadata properly
- Document routing structure
