---
description:
globs:
alwaysApply: false
---
# Waitlist Implementation Guide

## Overview
Shipkit includes a complete waitlist feature for product launches. The implementation follows Next.js App Router patterns with Server Components, Server Actions, and Drizzle ORM.

## Architecture Pattern

### Service Layer Pattern
The waitlist uses individual async functions instead of classes due to Next.js "use server" restrictions:

- ✅ **Correct**: Individual exported async functions in [waitlist-service.ts](mdc:src/server/services/waitlist-service.ts)
- ❌ **Incorrect**: Class-based services (not allowed in "use server" files)

### Database Schema
The waitlist table is defined in [schema.ts](mdc:src/server/db/schema.ts) with:
- Email uniqueness constraints
- Proper indexing for performance
- Timestamp tracking for analytics
- Metadata field for extensibility

## File Structure

### Core Components
- **Main Page**: [waitlist/page.tsx](mdc:src/app/(app)/waitlist/page.tsx) - Server component with Suspense
- **Hero Component**: [waitlist-hero.tsx](mdc:src/app/(app)/waitlist/_components/waitlist-hero.tsx) - Client component with form
- **Admin Dashboard**: [admin/waitlist/page.tsx](mdc:src/app/(app)/(admin)/admin/waitlist/page.tsx) - Server component

### Service Layer
- **Database Operations**: [waitlist-service.ts](mdc:src/server/services/waitlist-service.ts) - Individual async functions
- **Server Actions**: [waitlist-actions.ts](mdc:src/server/actions/waitlist-actions.ts) - Form handling and email integration

### Key Functions
```typescript
// Service functions (use server)
addWaitlistEntry() - Add new entry to database
isEmailOnWaitlist() - Check for duplicates
getWaitlistEntries() - Paginated retrieval
getWaitlistStats() - Analytics data

// Server actions (use server)
addToWaitlist() - Full signup flow with email
addToWaitlistSimple() - Quick email signup
getWaitlistStats() - Public stats access
```

## Database Patterns

### Migration Pattern
Use Drizzle Kit for schema changes:
```bash
bun run db:push
```

### Schema Conventions
- Use `createTable` with DB_PREFIX from env
- Include proper indexes for query patterns
- Use timestamps for audit trails
- Store metadata as JSON string

## Component Patterns

### Server Components (Default)
- Use for data fetching and analytics
- Render directly from database queries
- Example: [waitlist-stats.tsx](mdc:src/app/(app)/waitlist/_components/waitlist-stats.tsx)

### Client Components ("use client")
- Use for forms and interactive elements
- Handle loading states and user feedback
- Example: [waitlist-hero.tsx](mdc:src/app/(app)/waitlist/_components/waitlist-hero.tsx)

### Suspense Pattern
Wrap async components with Suspense for better UX:
```typescript
<Suspense fallback={<SuspenseFallback />}>
  <WaitlistStats />
</Suspense>
```

## Email Integration

### Resend Configuration
- Multiple API key support (RESEND_API_KEY + RESEND_API_KEY fallback)
- Optional audience integration
- Graceful error handling when email fails
- Configuration in [resend.ts](mdc:src/lib/resend.ts)

### Email Flow
1. User submits form
2. Database entry created first
3. Email sent as secondary action
4. Graceful fallback if email fails

## Admin Dashboard Patterns

### Real-time Stats
- Server-side rendering for live data
- Promise.all for parallel data fetching
- Proper error boundaries

### Data Display
- Use Shadcn/UI Card components
- Format numbers with toLocaleString()
- Include relative timestamps with date-fns

## Testing Patterns

### Service Layer Tests
- Test function interfaces exist
- Validate data structures
- Mock database for unit tests
- Example: [waitlist-service.test.ts](mdc:tests/unit/server/services/waitlist-service.test.ts)

## Error Handling

### Database Null Checks
Always check if database is initialized:
```typescript
if (!db) {
  throw new Error("Database not initialized");
}
```

### Graceful Fallbacks
- Continue if email service fails
- Provide meaningful error messages
- Log errors for debugging

## Performance Considerations

### Database Optimization
- Proper indexing on email and created_at
- Pagination for large datasets
- Select only needed fields

### Caching Strategy
- Server components cache automatically
- Use revalidation for admin dashboards
- Consider edge caching for public stats

## Security Patterns

### Input Validation
- Email format validation
- SQL injection prevention via Drizzle
- Sanitize user inputs

### Access Control
- Admin routes protected by middleware
- Public routes rate-limited
- No sensitive data in client components

## Documentation

Complete feature documentation available in [waitlist.mdx](mdc:src/content/docs/waitlist.mdx) including:
- Setup instructions
- Environment variables
- API examples
- Troubleshooting guide
