---
title: Server Action Generator
description: Template for creating Next.js server actions with proper validation and error handling
---

# Server Action Template

## Basic Structure
```ts
'use server'

import { z } from "zod"
import { createSafeAction } from "@/lib/create-safe-action"

// Input validation
const inputSchema = z.object({
  // Define input fields
})

// Output type
const outputSchema = z.object({
  // Define output fields
})

// Action implementation
async function action(input: z.infer<typeof inputSchema>) {
  try {
    // Business logic here
    return { success: true }
  } catch (error) {
    return { error: "Something went wrong" }
  }
}

// Create safe action with validation
export const serverAction = createSafeAction(inputSchema, outputSchema, action)
```

## Best Practices
- Keep actions focused and small
- Validate all inputs with Zod
- Handle errors gracefully
- Use proper TypeScript types
- Add proper logging
- Document side effects
- Consider optimistic updates

## Common Patterns
- Data mutations only
- Form submissions
- State updates
- File uploads
- Email sending
- Background jobs
- Cache invalidation

## Security
- Validate authentication
- Check authorization
- Sanitize inputs
- Handle sensitive data
- Prevent CSRF attacks
- Rate limit if needed
- Log security events

## Error Handling
- Use proper error types
- Return meaningful messages
- Log errors appropriately
- Handle edge cases
- Consider retries
- Implement fallbacks
- Document error states

@nextjs.mdc
@security.mdc
@error-handling.mdc
