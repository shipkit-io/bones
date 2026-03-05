---
description: Project structure, tech stack, and rules for interacting with the project
globs: "*"
alwaysApply: false
---

# Project Overview

This is a Next.js project using:
- App Router
- Shadcn/UI
- Tailwind CSS
- Resend
- Builder.io
- Payload CMS 3
- NextAuth/AuthJS@v5
- TypeScript
- Bun

## Multi-Zone Architecture Support

Shipkit supports multi-zone deployment for scalable applications:

### Zone Configuration
- Main app serves core functionality (marketing, dashboard, auth)
- Secondary zones can be deployed for specialized content:
  - `/docs/*` - Documentation and guides
  - `/blog/*` - Blog and articles
  - `/ui/*` - UI component library showcase
  - `/tools/*` - Developer tools and utilities

### Zone Implementation Patterns
- Each zone uses a full Shipkit installation for consistency
- Zones are configured with `basePath` and `assetPrefix`
- Navigation between zones uses anchor tags (`<a>`) instead of Next.js `<Link>`
- Shared authentication and design system across zones
- Environment variables control zone routing and deployment

### Zone Development
```bash
# Clone Shipkit for each zone
git clone https://github.com/lacymorrow/shipkit.git shipkit-docs
git clone https://github.com/lacymorrow/shipkit.git shipkit-blog
git clone https://github.com/lacymorrow/shipkit.git shipkit-ui
git clone https://github.com/lacymorrow/shipkit.git shipkit-tools
```

## Directory Structure
```
src/
├── app/                    # Next.js app router pages
│   ├── (app)/             # Main application routes
│   ├── (authentication)/  # Auth pages (sign-in, sign-up, etc.)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (demo)/           # Demo and example pages
│   ├── (integrations)/   # Third-party integrations
│   ├── (landing)/        # Marketing pages
│   ├── (legal)/          # Legal pages (privacy, terms)
│   ├── (shipkit)/        # Shipkit-specific pages
│   └── api/              # API routes
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/UI components
│   ├── primitives/       # Base primitive components
│   ├── blocks/           # Larger composed components
│   └── layouts/          # Layout components
├── lib/                  # Utility functions and shared code
│   ├── utils/           # General utilities
│   ├── schemas/         # Validation schemas
│   ├── payload/         # Payload CMS configuration
│   └── trpc/            # tRPC configuration
├── server/               # Server-side code
│   ├── actions/          # Server actions
│   ├── services/         # Business logic and data access
│   └── db/              # Database configuration
├── content/              # MDX and static content
│   ├── docs/            # Documentation content
│   ├── blog/            # Blog content
│   ├── faq/             # FAQ content
│   └── features/        # Feature descriptions
├── styles/               # Global styles and Tailwind config
└── types/                # TypeScript type definitions
```

## File Naming Conventions
- Use `kebab-case` for directories and files
- Use `.tsx` for React components
- Use `.ts` for TypeScript files
- Use `.test.tsx` for test files
- Use `.css` for style files
- Use `.mdx` for documentation
- Use `.mdc` for rule documentation

## Component Structure
- One component per file
- Export as named export (prefer arrow functions)
- Use TypeScript interfaces for props
- Keep components focused and small (under 500-700 lines)
- Follow atomic design principles
- Use descriptive, explicit variable names

## Code Organization Principles
- Make files small and discrete (under 500 lines when possible)
- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Structure files: exported component, subcomponents, helpers, static content, types
- Use the simplest solution first and only add complexity when necessary

## State Management Best Practices
- Minimize 'use client', 'useEffect', and 'setState'
- Favor React Server Components (RSC)
- Use functional components with TypeScript interfaces
- Avoid circular dependencies between state variables
- Don't update state directly inside useEffect without dependencies
- Use unidirectional data flow: parent state flowing to children
- For complex state transitions, implement dedicated functions rather than direct setters

## Navigation Patterns
- Prefer declarative links over imperative navigation (`router.push`)
- Use `src/components/primitives/link-with-transition` instead of `next/link`
- For styled links that look like buttons, use: `<Link className={cn(buttonVariants({ variant: "...", size: "..." }))} ...>`
- Only use router navigation for complex scenarios (form submissions with redirects)
- For multi-zone navigation, use anchor tags (`<a>`) between zones

## API Structure and Patterns
- RESTful endpoints in `app/api`
- Server actions in `server/actions`
- Services in `server/services`
- Type definitions in `types`
- Environment variables in `.env`
- Never use server actions to fetch data (use Server Components)
- Server actions should call services for server-side operations

## Performance Optimization
- Wrap client components in Suspense with fallback
- Use dynamic loading for non-critical components
- Optimize images: use WebP format, include size data, implement lazy loading
- Use 'nuqs' for URL search parameter state management
- Optimize Web Vitals (LCP, CLS, FID)

## Error Handling and Validation
- Implement robust error handling for database operations and API requests
- Validate input data to prevent runtime errors
- Add comments to explain complex logic or important decisions
- Use TypeScript's type system to enforce correct data structures
- Handle potential undefined values appropriately

## Testing Strategy
- Jest for unit tests
- React Testing Library for components
- Playwright for E2E tests
- Vitest for modern testing
- Component documentation in Storybook
- Test coverage for new features

## Documentation Standards
- README.md in root directory
- Component documentation in stories
- API documentation with OpenAPI
- Type documentation with TSDoc
- Inline comments for complex logic
- Rule documentation in `.cursor/rules/`

## Dependencies Management
- Use exact versions in package.json
- Keep dependencies up to date
- Minimize bundle size
- Use peer dependencies appropriately
- Document breaking changes
- Use Bun as package manager

## Development Workflow
- Use feature branches for development
- Write meaningful commit messages
- Review code before merging
- Run tests before pushing
- Keep main branch stable
- Follow semantic versioning

## Environment Configuration
- Use environment variables for feature flags
- Support graceful degradation when services unavailable
- Configure separate environments for zones
- Use `.env.local` for development
- Set production variables in deployment platform

## Multi-Zone Deployment
- Deploy each zone as separate Vercel project
- Configure environment variables for zone domains
- Use consistent naming: `shipkit-docs`, `shipkit-blog`, etc.
- Maintain shared authentication across zones
- Test cross-zone navigation thoroughly
