---
title: "Better Auth Integration Implementation Plan"
description: "Implementation plan and guide for integrating Better Auth with Shipkit for enhanced authentication capabilities and user management."
---

# Better Auth Integration Implementation Plan

## Overview

This document tracks the implementation of Better Auth as an optional authentication system alongside Auth.js in the Shipkit boilerplate. Users can choose their authentication system via environment variables.

## Implementation Strategy

### Core Principles

- **Graceful Degradation**: Better Auth only activates when `BETTER_AUTH_ENABLED=true`
- **Coexistence**: Better Auth and Auth.js can coexist without conflicts
- **Environment-Driven**: Feature detection based on environment variables
- **Service Pattern**: Use existing service patterns for consistency
- **Type Safety**: Maintain TypeScript type safety throughout

### Tasks

- [x] Add Better Auth environment variables and feature flags
- [x] Install Better Auth dependencies
- [x] Create Better Auth configuration
- [x] Create Better Auth providers configuration
- [x] Create Better Auth service layer
- [x] Add Better Auth API routes
- [x] Create Better Auth client utilities
- [x] Update authentication UI components to support Better Auth
- [ ] Add Better Auth session management
- [x] Create database schema for Better Auth
- [ ] Add middleware for Better Auth
- [ ] Update type definitions
- [ ] Create graceful fallback logic
- [ ] Add Better Auth to auth providers list
- [ ] Test integration and ensure no conflicts
- [ ] Update documentation

## Technical Implementation

### 1. Environment Variables

Add these new environment variables:

```
BETTER_AUTH_ENABLED=true
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_BASE_URL=http://localhost:3000
```

### 2. Feature Flag Configuration

Add to `src/config/features-config.ts`:

```typescript
const isBetterAuthEnabled =
  process.env.BETTER_AUTH_ENABLED === "true" &&
  !!process.env.BETTER_AUTH_SECRET;
```

### 3. Better Auth Configuration Structure

```
src/
  server/
    better-auth/
      config.ts           # Main Better Auth configuration
      providers.ts        # Better Auth providers
      client.ts          # Better Auth client setup
      schema.ts          # Database schema
      middleware.ts      # Better Auth middleware
  lib/
    better-auth/
      client.ts          # Client-side utilities
      types.ts           # Type definitions
  app/
    api/
      better-auth/
        [...path]/
          route.ts       # Better Auth API routes
```

### 4. Authentication Service Updates

Extend existing `AuthService` to support Better Auth when enabled:

- Add Better Auth validation methods
- Add Better Auth user synchronization
- Maintain compatibility with existing Auth.js flows

### 5. UI Component Updates

Update authentication components to detect and use Better Auth when available:

- `oauth-buttons.tsx` - Add Better Auth provider buttons
- `auth-form.tsx` - Add Better Auth form handling
- Sign-in/Sign-up pages - Add Better Auth flows

### 6. Session Management

Create unified session interface that works with both Auth.js and Better Auth:

- Unified session type
- Session provider wrapper
- Hook for accessing current session

### 7. Database Schema

Add Better Auth tables alongside existing auth tables:

- User sessions
- Account connections
- Verification tokens
- Two-factor authentication data

## Implementation Details

### Better Auth vs Auth.js Decision Matrix

| Feature            | Auth.js         | Better Auth |
| ------------------ | --------------- | ----------- |
| OAuth Providers    | ✅ Built-in     | ✅ Built-in |
| Magic Links        | ✅              | ✅          |
| 2FA/MFA            | ❌              | ✅          |
| Session Management | ✅ JWT/Database | ✅ Database |
| TypeScript         | ⚠️ Partial      | ✅ Full     |
| Middleware         | ✅              | ✅          |
| Customization      | ⚠️ Limited      | ✅ High     |

### Environment Variable Patterns

Following Shipkit's existing pattern:

```typescript
// Environment detection
const isBetterAuthEnabled = process.env.BETTER_AUTH_ENABLED === "true" || !!process.env.BETTER_AUTH_SECRET;

// Feature flag
NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: String(isBetterAuthEnabled),

// Provider detection
const isBetterAuthGoogleEnabled = isBetterAuthEnabled && !!process.env.BETTER_AUTH_GOOGLE_CLIENT_ID;
```

### Graceful Fallback Strategy

1. If Better Auth is enabled and configured → Use Better Auth
2. If Better Auth is disabled → Fall back to Auth.js
3. If neither is configured → Show configuration instructions
4. If both are configured → Prefer Better Auth (configurable)

### Database Considerations

- Better Auth uses its own schema
- Existing Auth.js tables remain unchanged
- User synchronization between systems when needed
- Migration utilities for switching between systems

## Testing Strategy

- [ ] Unit tests for Better Auth service
- [ ] Integration tests for auth flows
- [ ] E2E tests for sign-in/sign-up
- [ ] Test graceful degradation scenarios
- [ ] Test coexistence with Auth.js

## Documentation Updates

- [ ] Update auth documentation
- [ ] Add Better Auth setup guide
- [ ] Document environment variables
- [ ] Add migration guide from Auth.js
- [ ] Update API documentation

## Notes

- Better Auth provides better TypeScript support and more modern APIs
- Supports 2FA/MFA out of the box
- More flexible session management
- Better developer experience with full type safety
- Maintain backward compatibility with existing Auth.js implementation

## Current Progress Summary

### ✅ Completed

1. **Environment Configuration** - Added all necessary environment variables and feature flags
2. **Package Installation** - Better Auth v1.2.8 installed and ready
3. **Core Configuration** - Main Better Auth config with providers and callbacks
4. **API Routes** - Better Auth API endpoint handler created
5. **Client Utilities** - Better Auth client hooks and social sign-in utilities
6. **Database Schema** - Complete schema with user, session, account, verification, and 2FA tables
7. **UI Components** - Better Auth OAuth buttons and unified wrapper component
8. **Provider Components** - Better Auth provider wrapper with feature detection

### 🔄 In Progress

- Session management integration
- Middleware setup
- Type definitions finalization
- Graceful fallback logic
- Testing implementation

### 🎯 Key Features Ready

- ✅ OAuth providers (Google, GitHub, Discord)
- ✅ Email/password authentication
- ✅ Database integration with Drizzle ORM
- ✅ Environment-based feature flags
- ✅ Graceful coexistence with Auth.js
- ✅ UI component switching based on configuration

### 📝 Next Steps

1. Complete middleware implementation
2. Add session management hooks
3. Create migration utilities
4. Implement testing suite
5. Update documentation
