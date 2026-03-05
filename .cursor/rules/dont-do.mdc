---
description: Things to Avoid - Anti-patterns and Common Mistakes
globs: *.ts, *.tsx, *.js, *.jsx, src/**/*
alwaysApply: false
---
# Don't Do These Things

## Next.js
- Prefer use pages router (use app router)
- Don't nest server components in client components
- Don't use `use client` in server components
- Don't fetch data with server actions
- Don't mix client and server code
- Don't use getStaticProps or getServerSideProps
- Don't use router.push in server components

## React
- Don't use class components
- Don't use default exports
- Don't use React.FC type
- Don't use inline styles (use Tailwind)
- Don't use useState when useReducer is clearer
- Don't mutate state directly
- Don't use indexes as keys

## TypeScript
- Don't use `any` type
- Don't disable TypeScript checks
- Don't use `@ts-ignore`
- Don't use non-null assertion operator
- Don't use `Object` type
- Don't use `Function` type
- Don't use `{}` as a type

## State Management
- Don't use global state for local concerns
- Don't prop drill more than 2 levels
- Don't mutate context values directly
- Don't use Redux (use context + reducers)
- Don't store derived state
- Don't store server state client-side
- Don't duplicate state

## API
- Don't expose internal APIs publicly
- Don't handle errors silently
- Don't return raw error messages
- Don't trust client-side data
- Don't expose sensitive information
- Don't make unnecessary API calls
- Don't ignore API errors

## Security
- Don't store secrets in code
- Don't use eval() or new Function()
- Don't trust user input
- Don't expose stack traces
- Don't store sensitive data client-side
- Don't use innerHTML
- Don't disable security headers

## Performance
- Don't bundle unused code
- Don't load unnecessary resources
- Don't block the main thread
- Don't ignore memory leaks
- Don't skip code splitting
- Don't ignore performance metrics
- Don't render unnecessary components

## Database
- Don't use raw SQL queries
- Don't store passwords in plain text
- Don't use boolean fields (use dates)
- Don't ignore database indexes
- Don't leak connection pools
- Don't ignore transaction boundaries
- Don't store large blobs

## Payment Provider Integration
- Don't store order IDs in only one database field (use both `orderId` and `processorOrderId`)
- Don't assume provider data maps to your field names
- Don't read from single fields without fallback logic
- Don't skip testing the complete data flow (Provider → Import → Database → Service → UI)
- Don't assume all providers follow the same data structure
- Don't ignore field mapping inconsistencies between providers
- Don't deploy provider changes without verifying admin UI displays correctly
- Don't hardcode field names in service layer without fallbacks
- Don't skip creating debug scripts for provider integration testing

## Testing
- Don't skip writing tests
- Don't test implementation details
- Don't use snapshot tests exclusively
- Don't mock everything
- Don't ignore test coverage
- Don't write brittle tests
- Don't test third-party code

## Code Quality
- Don't repeat code (DRY)
- Don't ignore TypeScript errors
- Don't skip code reviews
- Don't leave TODO comments
- Don't ignore linter warnings
- Don't write unclear code
- Don't skip documentation
