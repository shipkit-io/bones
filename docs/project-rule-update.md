---
title: "Project Overview"
description: "Comprehensive overview of the Shipkit project structure, components, and implementation details for developers working with the codebase."
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

## Multi-Zone Architecture

Shipkit.io uses a multi-zone architecture where different Shipkit applications serve different paths on the same domain. Each zone is a complete Shipkit installation, customized for its specific purpose.

### Zone Structure

```
shipkit.io/          → Main Shipkit app (marketing, dashboard, auth)
shipkit.io/docs/*    → Documentation Shipkit app (customized for docs)
shipkit.io/blog/*    → Blog Shipkit app (customized for blogging)
shipkit.io/ui/*      → UI Component Library Shipkit app (component showcase)
shipkit.io/tools/*   → Developer Tools Shipkit app (interactive utilities)
```

### Zone Implementation

Each zone is created by cloning the main Shipkit repository and customizing it:

```bash
# Create zone apps
git clone https://github.com/lacymorrow/shipkit.git shipkit-docs
git clone https://github.com/lacymorrow/shipkit.git shipkit-blog
git clone https://github.com/lacymorrow/shipkit.git shipkit-ui
git clone https://github.com/lacymorrow/shipkit.git shipkit-tools
```

### Zone Configuration

Each zone requires specific `next.config.ts` configuration:

```typescript
// Example: shipkit-docs/next.config.ts
const nextConfig: NextConfig = {
  env: {
    ...buildTimeFeatureFlags,
  },
  redirects,

  // Multi-zone configuration
  assetPrefix: "/docs-static",
  basePath: "/docs",

  // Zone-specific rewrites for assets
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/docs-static/_next/:path+",
          destination: "/_next/:path+",
        },
      ],
    };
  },

  // Rest of Shipkit configuration...
};
```

### Main App Routing

The main Shipkit app uses rewrites to route to zones:

```typescript
// Main app next.config.ts
async rewrites() {
  const multiZoneRewrites = [];

  if (process.env.DOCS_DOMAIN) {
    multiZoneRewrites.push(
      { source: '/docs', destination: `${process.env.DOCS_DOMAIN}/docs` },
      { source: '/docs/:path*', destination: `${process.env.DOCS_DOMAIN}/docs/:path*` },
      { source: '/docs-static/:path*', destination: `${process.env.DOCS_DOMAIN}/docs-static/:path*` }
    );
  }

  // Similar patterns for other zones...
  return multiZoneRewrites;
}
```

### Environment Variables

#### Main App (.env.local)

```bash
# Multi-Zone Configuration
DOCS_DOMAIN=http://localhost:3001
BLOG_DOMAIN=http://localhost:3002
UI_DOMAIN=http://localhost:3003
TOOLS_DOMAIN=http://localhost:3004

# Standard Shipkit variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=your_database_url
ADMIN_EMAIL=admin@shipkit.io
NEXTAUTH_SECRET=your_auth_secret
```

#### Zone-Specific Environment Variables

```bash
# shipkit-docs/.env.local
NEXT_PUBLIC_APP_URL=http://localhost:3001
DATABASE_URL=your_docs_database_url  # Can share or separate
ADMIN_EMAIL=admin@shipkit.io
NEXTAUTH_SECRET=your_auth_secret
# Zone-specific variables
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key
```

### Cross-Zone Navigation

Use anchor tags with Shipkit components for cross-zone navigation:

```tsx
// ✅ Correct - Cross-zone navigation
import { Button } from "@/components/ui/button";

<Button asChild variant="outline">
  <a href="/docs/getting-started">Read Documentation</a>
</Button>;

// ✅ Correct - Within zone navigation
import Link from "next/link";
<Link href="/dashboard">Dashboard</Link>;
```

### Zone Customization Guidelines

#### Documentation Zone

- **Keep**: Authentication, admin panel, SEO features
- **Remove**: E-commerce, marketing pages
- **Add**: Enhanced MDX, search functionality, API documentation

#### Blog Zone

- **Keep**: User profiles, CMS integration, analytics
- **Remove**: Complex dashboard, e-commerce
- **Add**: Social sharing, RSS feeds, categories, author profiles

#### UI Library Zone

- **Keep**: Full component library, theming system
- **Focus**: Component showcase, interactive demos
- **Add**: Code copying, Storybook integration, accessibility docs

#### Tools Zone

- **Keep**: File handling, server actions, API endpoints
- **Focus**: Developer utilities and tools
- **Add**: Monaco Editor, API testing, schema validators

### Development Workflow

#### Local Development

```bash
# Terminal 1 - Main Shipkit app
cd shipkit && bun dev

# Terminal 2 - Documentation Shipkit app
cd shipkit-docs && bun dev -- --port 3001

# Terminal 3 - Blog Shipkit app
cd shipkit-blog && bun dev -- --port 3002

# Terminal 4 - UI Library Shipkit app
cd shipkit-ui && bun dev -- --port 3003

# Terminal 5 - Tools Shipkit app
cd shipkit-tools && bun dev -- --port 3004
```

#### Deployment Strategy

1. Deploy each Shipkit app separately to Vercel
2. Set environment variables pointing to zone domains
3. Assign shipkit.io domain to main Shipkit app
4. Test cross-zone navigation and functionality

### Shared Services

#### Authentication

- Can be shared across zones using same NextAuth configuration
- User sessions persist across zone navigation
- Zone-specific permissions can be implemented

#### Database

- Zones can share the same database with zone-specific tables
- Or use separate databases for better isolation
- Consider data relationships between zones

#### Analytics & Monitoring

- Use consistent tracking across all zones
- Leverage Shipkit's built-in monitoring for all zones
- Zone-specific metrics and dashboards

## Directory Structure

```
shipkit.io/
├── shipkit/                    # Main Shipkit app
│   ├── src/
│   ├── next.config.ts         # With multi-zone rewrites
│   └── ...
├── shipkit-docs/              # Documentation Shipkit app
│   ├── src/
│   ├── next.config.ts         # basePath: '/docs'
│   └── ... (full Shipkit structure)
├── shipkit-blog/              # Blog Shipkit app
│   ├── src/
│   ├── next.config.ts         # basePath: '/blog'
│   └── ... (full Shipkit structure)
├── shipkit-ui/                # UI Library Shipkit app
│   ├── src/
│   ├── next.config.ts         # basePath: '/ui'
│   └── ... (full Shipkit structure)
└── shipkit-tools/             # Tools Shipkit app
    ├── src/
    ├── next.config.ts         # basePath: '/tools'
    └── ... (full Shipkit structure)
```

## Standard Project Structure (Per Zone)

```
src/
├── app/                    # Next.js app router pages
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/UI components
│   └── shared/           # Shared components
├── lib/                  # Utility functions and shared code
├── server/               # Server-side code
│   ├── actions/          # Server actions
│   ├── services/         # Business logic and data access
│   └── api/              # API routes
├── styles/               # Global styles and Tailwind config
└── types/                # TypeScript type definitions
```

## File Naming

- Use `kebab-case` for file names
- Use `.tsx` for React components
- Use `.ts` for TypeScript files
- Use `.test.tsx` for test files
- Use `.css` for style files
- Use `.mdx` for documentation

## Component Structure

- One component per file
- Export as named export
- Use TypeScript interfaces for props
- Keep components focused and small
- Follow atomic design principles
- **Multi-Zone**: Ensure components work across zones

## Code Organization

- Group related code together
- Keep files small and focused
- Use index files for exports
- Separate concerns appropriately
- Follow DRY principles
- **Multi-Zone**: Share common utilities across zones

## State Management

- Use React hooks for local state
- Use context for shared state
- Use server components when possible
- Avoid prop drilling
- Keep state close to where it's used
- **Multi-Zone**: Consider cross-zone state sharing needs

## API Structure

- RESTful endpoints in `app/api`
- Server actions in `server/actions`
- Services in `server/services`
- Type definitions in `types`
- Environment variables in `.env`
- **Multi-Zone**: Zone-specific API endpoints when needed

## Testing

- Jest for unit tests
- React Testing Library for components
- Cypress for E2E tests
- MSW for API mocking
- Storybook for component development
- **Multi-Zone**: Test cross-zone navigation and functionality

## Documentation

- README.md in root
- Component documentation in stories
- API documentation with OpenAPI
- Type documentation with TSDoc
- Inline comments for complex logic
- **Multi-Zone**: Zone-specific documentation strategies

## Dependencies

- Use exact versions
- Keep dependencies up to date
- Minimize bundle size
- Use peer dependencies appropriately
- Document breaking changes
- **Multi-Zone**: Coordinate updates across all zones

## Development Workflow

- Use feature branches
- Write meaningful commit messages
- Review code before merging
- Run tests before pushing
- Keep main branch stable
- **Multi-Zone**: Test changes across all affected zones

## Multi-Zone Best Practices

### Performance

- Optimize each zone for its specific content type
- Use Shipkit's built-in performance features across all zones
- Monitor Core Web Vitals for each zone independently
- Implement proper caching strategies per zone

### SEO

- Leverage Shipkit's SEO features in each zone
- Ensure proper meta tags for zone-specific content
- Implement zone-specific sitemaps
- Maintain consistent branding across zones

### Security

- Use consistent authentication across zones
- Implement zone-specific authorization when needed
- Regular security audits for all zones
- Shared security policies and configurations

### Maintenance

- Coordinate Shipkit updates across all zones
- Implement consistent monitoring across zones
- Plan for zone-specific feature development
- Maintain shared component libraries

This multi-zone architecture allows Shipkit.io to scale content and functionality while maintaining optimal performance, consistent branding, and development velocity across all zones.
