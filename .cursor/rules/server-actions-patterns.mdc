---
description:
globs:
alwaysApply: false
---
# Server Actions & Services Patterns

## Next.js "use server" Restrictions

### Critical Rule: Only Async Functions in "use server" Files
❌ **Never export classes from "use server" files**
```typescript
// This will cause build errors
"use server";
export class MyService { // ❌ BREAKS
  static async method() {}
}
```

✅ **Always use individual exported async functions**
```typescript
// This works correctly
"use server";
export async function myServiceMethod() { // ✅ WORKS
  // implementation
}
```

## Service Layer Pattern

### Function Naming Convention
Use descriptive function names that indicate the entity and action:
```typescript
// Waitlist service functions
addWaitlistEntry()
getWaitlistEntry()
updateWaitlistEntry()
deleteWaitlistEntry()

// User service functions
addUserAccount()
getUserProfile()
updateUserSettings()
```

### Database Null Checks
Always validate database connection in service functions:
```typescript
export async function serviceFunction() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  // proceed with database operations
}
```

## Server Actions Pattern

### Form Handling Actions
Server actions should handle the complete user flow:
```typescript
export async function handleFormSubmission(formData: FormData) {
  try {
    // 1. Validate input
    // 2. Check business rules (duplicates, etc.)
    // 3. Call service functions
    // 4. Handle side effects (emails, etc.)
    // 5. Return success/error response
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Error Handling Pattern
Always provide user-friendly error responses:
```typescript
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error("Specific error:", error.message);
    return { success: false, error: error.message };
  }
  console.error("Unknown error:", error);
  return { success: false, error: "An unknown error occurred" };
}
```

## Import/Export Patterns

### Service Function Imports
Import specific functions, optionally with aliases:
```typescript
import {
  addWaitlistEntry,
  isEmailOnWaitlist,
  getWaitlistStats as getStats
} from "@/server/services/waitlist-service";
```

### Avoid Default Exports
Use named exports for better TypeScript support:
```typescript
// ✅ Good
export async function myFunction() {}

// ❌ Avoid
export default async function() {}
```

## Database Operation Patterns

### Single Responsibility Functions
Each service function should have one clear purpose:
```typescript
// ✅ Good - single responsibility
export async function addWaitlistEntry(data: NewEntry) {}
export async function isEmailOnWaitlist(email: string) {}

// ❌ Avoid - multiple responsibilities
export async function handleWaitlistOperations(action: string, data: any) {}
```

### Proper Return Types
Use specific TypeScript return types:
```typescript
export async function getWaitlistStats(): Promise<{
  total: number;
  notified: number;
  pending: number;
}> {
  // implementation
}
```

## Testing Service Functions

### Interface Testing
Test that functions exist and have correct signatures:
```typescript
import { myServiceFunction } from "@/server/services/my-service";

it("should have correct interface", () => {
  expect(typeof myServiceFunction).toBe("function");
});
```

### Mock Database for Tests
Use dependency injection or mocking for unit tests:
```typescript
// Mock the database for testing
vi.mock("@/server/db", () => ({
  db: mockDb
}));
```

## File Organization

### Service Files Structure
```
src/server/
├── services/          # Business logic functions
│   ├── user-service.ts
│   ├── waitlist-service.ts
│   └── email-service.ts
├── actions/           # Form handling and UI interactions
│   ├── user-actions.ts
│   └── waitlist-actions.ts
└── db/               # Database configuration
    ├── schema.ts
    └── index.ts
```

### Function Exports
Keep related functions in the same file:
```typescript
// waitlist-service.ts
export async function addWaitlistEntry() {}
export async function getWaitlistEntry() {}
export async function updateWaitlistEntry() {}
export async function deleteWaitlistEntry() {}
```

## Performance Patterns

### Parallel Database Operations
Use Promise.all for independent queries:
```typescript
export async function getWaitlistDashboardData() {
  const [stats, entries] = await Promise.all([
    getWaitlistStats(),
    getWaitlistEntries({ limit: 100 })
  ]);
  return { stats, entries };
}
```

### Pagination Support
Include pagination options in list functions:
```typescript
export async function getWaitlistEntries(
  options: {
    limit?: number;
    offset?: number;
    orderBy?: "asc" | "desc";
  } = {}
): Promise<Entry[]> {
  const { limit = 50, offset = 0, orderBy = "desc" } = options;
  // implementation
}
```

This pattern ensures service functions are properly structured for Next.js App Router and provides clear separation of concerns between data access and user interface logic.
