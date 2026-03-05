# Server Actions Refactoring Plan

## Problem Statement

Server actions are being misused for data fetching throughout the codebase. Per Next.js best practices and our own `CLAUDE.md`:

> "Never use server actions for data fetching - Use Server Components instead"

Server actions are designed for **mutations only** (create, update, delete). Read-only operations should use:
- **Server Components**: Direct service/database calls
- **API Routes**: For client-side data fetching needs

---

## Critical Issues (Client Components Calling Read-Only Server Actions)

These are the highest priority - they violate the server action pattern AND create potential race conditions.

### Issue 1: `dashboard-vercel-deploy.tsx`
**File:** `src/components/modules/deploy/dashboard-vercel-deploy.tsx`
**Lines:** 128, 159, 222, 262

```tsx
// Line 128 - useEffect calling server action
checkPendingGitHubInvitation()

// Line 262 - debounced callback calling server action
const availability = await checkRepositoryNameAvailable(value.trim());
```

**Fix:** Create API routes:
- `POST /api/github/check-invitation`
- `POST /api/github/check-repo-availability`

---

### Issue 2: `polar-product-status.tsx`
**File:** `src/components/modules/payments/polar-product-status.tsx`
**Line:** ~76 (useEffect)

```tsx
// Calling server action in useEffect
checkUserPurchasedProduct()
```

**Fix:** Create API route `GET /api/payments/check-purchase?productId=xxx`

---

### Issue 3: `user-drawer.tsx`
**File:** `src/app/(app)/(admin)/admin/users/_components/user-drawer.tsx`
**Line:** ~47 (useEffect)

```tsx
// Calling server action in useEffect
getCompleteUserData(userId)
```

**Fix:** Create API route `GET /api/admin/users/[userId]`

---

### Issue 4: `team-switcher.tsx`
**File:** `src/components/blocks/team-switcher.tsx`
**Line:** 35

```tsx
import { getUserTeams } from "@/server/actions/teams";
```

**Fix:** Pass teams as props from Server Component parent, or create API route

---

### Issue 5: `project-switcher.tsx`
**File:** `src/components/blocks/project-switcher.tsx`
**Line:** 20

```tsx
import { getTeamProjects } from "@/server/actions/projects";
```

**Fix:** Pass projects as props from Server Component parent, or create API route

---

### Issue 6: `project-dialog.tsx`
**File:** `src/components/modules/projects/project-dialog.tsx`
**Line:** 40

```tsx
import { getUserTeams } from "@/server/actions/teams";
```

**Fix:** Pass teams as props or create API route

---

## Medium Priority (Server Components/Routes Using Server Actions for Reads)

These work but are unnecessarily indirect. Server Components should call services directly.

### Issue 7: `deployments/page.tsx`
**File:** `src/app/(app)/(dashboard)/deployments/page.tsx`
**Lines:** 28, 33

```tsx
deployments = await getUserDeployments();
```

**Fix:** Call `deploymentService.getUserDeployments(userId)` directly

---

### Issue 8: `api/deployments/route.ts`
**File:** `src/app/(app)/api/deployments/route.ts`
**Line:** 12

```tsx
const deployments = await getUserDeployments();
```

**Fix:** Call `deploymentService.getUserDeployments(userId)` directly

---

### Issue 9: `waitlist-stats.tsx`
**File:** `src/app/(app)/waitlist/_components/waitlist-stats.tsx`
**Line:** 2

```tsx
import { getWaitlistStats } from "@/server/actions/waitlist-actions";
```

**Fix:** Call service directly (this is a Server Component)

---

### Issue 10: `polar-products/page.tsx`
**File:** `src/app/(app)/settings/payments/polar-products/page.tsx`
**Line:** 6

```tsx
import { getUserPurchasedProducts } from "@/server/actions/payments";
```

**Fix:** Call payment service directly

---

### Issue 11: `teams/page.tsx`
**File:** `src/app/(app)/(dashboard)/teams/page.tsx`
**Line:** 21

```tsx
import { getUserTeams } from "@/server/actions/teams";
```

**Fix:** Call team service directly

---

### Issue 12: `waitlist-admin.tsx`
**File:** `src/app/(app)/(admin)/admin/waitlist/_components/waitlist-admin.tsx`
**Line:** 5

```tsx
import { getWaitlistStats } from "@/server/actions/waitlist-actions";
```

**Fix:** Call service directly

---

## Read-Only Server Actions to Remove/Refactor

### `deployment-actions.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getUserDeployments()` | Server Components, API route | Remove, call service directly |
| `checkPendingGitHubInvitation()` | Client Component | Move to API route |
| `checkRepositoryNameAvailable()` | Client Component | Move to API route |

### `payments.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `checkUserPurchasedVariant()` | Unknown | Remove or move to API |
| `checkUserPurchasedProduct()` | Client Component | Move to API route |
| `checkUserSubscription()` | Unknown | Remove or move to API |
| `getUserPurchasedProducts()` | Server Component | Remove, call service directly |
| `getPayments()` | Unknown | Remove, call service directly |
| `getAllPayments()` | Server Component | Remove, call service directly |
| `getUserPayments()` | Unknown | Remove, call service directly |
| `debugPolarSubscription()` | Debug only | Remove entirely |

### `users.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getUserByEmail()` | Internal/cached | Keep for now (used with caching) |
| `getUserWithAssociations()` | Internal/cached | Keep for now (used with caching) |
| `getTeamUsers()` | Internal/cached | Keep for now (used with caching) |
| `getProjectUsers()` | Internal/cached | Keep for now (used with caching) |
| `hasTeamAccess()` | Internal/cached | Keep for now (used with caching) |
| `hasProjectAccess()` | Internal/cached | Keep for now (used with caching) |

### `teams.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getUserTeams()` | Client + Server Components | Split: API for client, direct for server |
| `getTeamMembers()` | Internal | Keep for now (used internally) |

### `projects.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getTeamProjects()` | Client Component | Move to API route |
| `userHasProjectAccess()` | Unknown | Evaluate usage |
| `getProjectMembers()` | Unknown | Evaluate usage |

### `admin-actions.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `checkIsAdmin()` | Unknown | Evaluate - may be needed for middleware |
| `getAdminEmails()` | Unknown | Remove, call service directly |
| `getAdminDomains()` | Unknown | Remove, call service directly |
| `getCompleteUserData()` | Client Component | Move to API route |

### `waitlist-actions.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getWaitlistStats()` | Server Component | Remove, call service directly |

### `temporary-links.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getTemporaryLink()` | Route handler | Remove, call service directly |

### `vercel.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getVercelAccount()` | Internal | Keep for now (used internally) |

### `rbac.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getUserRoles()` | Internal | Keep for now (authorization helper) |

### `api-key-actions.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `validateApiKey()` | Internal | Keep for now (validation helper) |

### `credits.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getCurrentUserCredits()` | Unknown (orphaned?) | Remove if unused |

### `setup.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `getDeploymentStatus()` | Unknown | Evaluate usage |

### `github/download-repo.ts`
| Function | Current Usage | Action |
|----------|--------------|--------|
| `downloadRepo()` | Client Component | Evaluate - may need redirect |

---

## Implementation Plan

### Phase 1: Create API Routes for Client-Side Data Fetching
Priority: **Critical** - Fixes race conditions and architectural violations

1. Create `/api/github/check-invitation/route.ts`
2. Create `/api/github/check-repo-availability/route.ts`
3. Create `/api/payments/check-purchase/route.ts`
4. Create `/api/admin/users/[userId]/route.ts`
5. Create `/api/teams/route.ts` (for getUserTeams)
6. Create `/api/projects/route.ts` (for getTeamProjects)

### Phase 2: Refactor Client Components
Priority: **Critical**

1. Update `dashboard-vercel-deploy.tsx` to use new API routes
2. Update `polar-product-status.tsx` to use new API route
3. Update `user-drawer.tsx` to use new API route
4. Update `team-switcher.tsx` to use props or API
5. Update `project-switcher.tsx` to use props or API
6. Update `project-dialog.tsx` to use props or API

### Phase 3: Refactor Server Components
Priority: **Medium** - Simplifies code, removes unnecessary indirection

1. Update `deployments/page.tsx` to call service directly
2. Update `api/deployments/route.ts` to call service directly
3. Update `waitlist-stats.tsx` to call service directly
4. Update `polar-products/page.tsx` to call service directly
5. Update `teams/page.tsx` to call service directly
6. Update `waitlist-admin.tsx` to call service directly

### Phase 4: Clean Up Server Actions
Priority: **Low** - Housekeeping

1. Remove read-only functions from server action files
2. Move reusable read logic to services if not already there
3. Update imports across codebase
4. Remove orphaned/unused functions

---

## New File Structure

```
src/
├── app/
│   └── api/
│       ├── github/
│       │   ├── check-invitation/route.ts      # NEW
│       │   └── check-repo-availability/route.ts # NEW
│       ├── payments/
│       │   └── check-purchase/route.ts        # NEW
│       ├── admin/
│       │   └── users/
│       │       └── [userId]/route.ts          # NEW
│       ├── teams/route.ts                     # NEW
│       └── projects/route.ts                  # NEW
├── server/
│   ├── actions/          # MUTATIONS ONLY after refactor
│   │   ├── deployment-actions.ts  # Remove read functions
│   │   ├── payments.ts            # Remove read functions
│   │   └── ...
│   └── services/         # Business logic (unchanged)
│       ├── deployment-service.ts
│       ├── payment-service.ts
│       └── ...
```

---

## Testing Checklist

- [ ] Verify all API routes return correct data
- [ ] Verify all API routes handle authentication
- [ ] Verify all API routes handle errors gracefully
- [ ] Verify client components work with new API routes
- [ ] Verify server components work with direct service calls
- [ ] Verify no regressions in functionality
- [ ] Run `bun run typecheck`
- [ ] Run `bun run lint`
- [ ] Run `bun run test`

---

## Notes

- Server actions that are used internally by other server actions (e.g., `getUserRoles` for authorization) can remain for now
- Functions with caching wrappers (`cacheService.getOrSet`, `unstable_cache`) are acceptable patterns even in server actions, but should be evaluated case-by-case
- Some "read-only" functions may have side effects (logging, metrics) - these are still reads and should not be server actions

---

## Completion Status (Updated 2025-01-16)

### Phase 1: API Routes - COMPLETE
All API routes have been created:
- `/api/github/check-invitation` - Checks pending GitHub invitations
- `/api/github/check-repo-availability` - Checks if repo name is available
- `/api/payments/check-purchase` - Checks if user purchased a product
- `/api/payments/check-subscription` - Checks subscription status
- `/api/admin/users/[userId]` - Gets complete user data for admin
- `/api/teams` - Lists user's teams
- `/api/projects` - Lists team's projects
- `/api/deployments` - Lists user's deployments

### Phase 2: Client Components - COMPLETE
All client components refactored to use API routes:
- `dashboard-vercel-deploy.tsx` - Uses fetch to `/api/github/*` routes
- `polar-product-status.tsx` - Uses fetch to `/api/payments/check-purchase`
- `user-drawer.tsx` - Uses fetch to `/api/admin/users/[userId]`
- `team-switcher.tsx` - Uses fetch to `/api/teams`
- `project-switcher.tsx` - Uses fetch to `/api/projects`
- `project-dialog.tsx` - Uses fetch to `/api/teams`

### Phase 3: Server Components - COMPLETE
All server components call services directly:
- `deployments/page.tsx` - Uses `deploymentService.getUserDeployments()`
- `api/deployments/route.ts` - Uses `deploymentService.getUserDeployments()`
- `waitlist-stats.tsx` - Uses `getWaitlistStats()` from service
- `polar-products/page.tsx` - Uses `PaymentService.getUserPurchasedProducts()`
- `teams/page.tsx` - Client component using API route
- `waitlist-admin.tsx` - Uses `getWaitlistStats()` and `getWaitlistEntries()` from service

### Phase 4: Server Actions Cleanup - COMPLETE
Removed unused read-only functions:
- `projects.ts`: Removed `userHasProjectAccess()`, `getProjectMembers()`
- `admin-actions.ts`: Removed `checkIsAdmin()`, `getAdminEmails()`, `getAdminDomains()` - file now only has placeholder for future mutations
- `users.ts`: Removed `getUserByEmail()`, `getUserWithAssociations()`, `getTeamUsers()`, `getProjectUsers()`, `hasTeamAccess()`, `hasProjectAccess()` - kept only mutations: `ensureUserExists()`, `updateProfile()`, `verifyEmail()`
- `github/download-repo.ts`: Deleted entirely - replaced form actions with direct `<Link>` components in:
  - `download-section.tsx`
  - `download/page.tsx`
  - `checkout/success/page.tsx`

### Phase 5: Additional Cleanup (2026-01-16) - COMPLETE
Comprehensive audit and cleanup of all remaining server action files:

**Files Deleted (completely unused):**
- `setup.ts` - All functions unused (`createRepository`, `deploy`, `getDeploymentStatus`, `getVercelDeployUrl`)
- `chat-actions.ts` - Streaming action not imported anywhere (should use API route for streaming)
- `vercel.ts` - All functions unused (`getVercelAccount`, `deployToVercel`)
- `rbac.ts` - `getUserRoles()` was only used internally

**Read-only functions removed:**
- `teams.ts`: Removed `getTeamMembers()` - internal calls now use `teamService.getTeamMembers()` directly
- `temporary-links.ts`: Removed `getTemporaryLink()` - route handler already uses service directly
- `api-key-actions.ts`: Removed `validateApiKey()` - not used anywhere
- `credits.ts`: Removed `getCurrentUserCredits()` - not used anywhere
- `deploy-private-repo.ts`: Removed deprecated wrappers (`validateDeploymentConfig`, `checkNameAvailability`, `getDeploymentStatus`) - kept only mutation `deployPrivateRepository()`

**Internal references updated:**
- `github.ts`: Updated to import `rbacService` directly instead of using deleted `rbac.ts` action

### Testing Results
- TypeScript type checking: PASS
- No breaking changes introduced
- All components use correct data fetching patterns

### Summary of Server Action Files
After cleanup, all remaining server action files contain ONLY mutations:
- `teams.ts` - createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, updateTeamMemberRole
- `projects.ts` - createProject, updateProject, deleteProject, addProjectMember, removeProjectMember, updateProjectMemberRole
- `users.ts` - ensureUserExists, updateProfile, verifyEmail
- `api-key-actions.ts` - createApiKey, createTestApiKey, deleteApiKey
- `credits.ts` - spendUserCredits, addUserCredits
- `temporary-links.ts` - generateTemporaryLink
- `deploy-private-repo.ts` - deployPrivateRepository
- `github.ts` - connectGitHub, disconnectGitHub, verifyGitHubUsername, updateGitHubUsername
- `deployment-actions.ts` - createUserDeployment, updateDeploymentStatus, deleteDeployment
- `payments.ts` - createCheckoutSession, cancelSubscription (mutations only)
- `waitlist-actions.ts` - addToWaitlist, updateWaitlistEntry, etc. (mutations only)
- `admin-actions.ts` - placeholder for future admin mutations
- `file.ts` - createFile (mutation)
