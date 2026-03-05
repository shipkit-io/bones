---
title: API Route Generator
description: Template for creating Next.js API routes with proper error handling and validation
---

# API Route Template

## Basic Structure
```ts
import { NextResponse } from "next/server"
import { z } from "zod"

// Input validation schema
const inputSchema = z.object({
  // Define input fields
})

// Response type
type ApiResponse = {
  data?: unknown
  error?: string
}

export async function POST(req: Request) {
  try {
    // Parse and validate input
    const body = await req.json()
    const input = inputSchema.parse(body)

    // Handle request
    const result = await handleRequest(input)

    // Return success response
    return NextResponse.json({ data: result })

  } catch (error) {
    // Handle different error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## Best Practices
- Always validate input with Zod
- Use proper HTTP status codes
- Implement rate limiting for public routes
- Add proper error handling
- Log errors appropriately
- Add request validation middleware
- Document API endpoints

## Security Considerations
- Validate authentication
- Check authorization
- Sanitize inputs
- Handle sensitive data
- Set proper CORS headers
- Rate limit requests
- Monitor for abuse

## Testing
- Add integration tests
- Test error cases
- Validate response formats
- Check rate limiting
- Test authentication
- Verify authorization
- Monitor performance

@security.mdc
@error-handling.mdc
