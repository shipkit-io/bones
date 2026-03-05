---
title: "Multi-Zone Architecture Implementation Summary for Shipkit.io"
description: "A comprehensive summary of the multi-zone architecture implementation for Shipkit.io, covering deployment strategies, configuration details, and best practices."
---

# Multi-Zone Architecture Implementation Summary for Shipkit.io

## Quick Decision Guide for Shipkit.io

### Choose **Vercel Proxy Project** if

- ✅ You want the simplest setup for shipkit.io
- ✅ You don't mind hard navigation between all routes
- ✅ You have separate teams managing docs, blog, UI, and tools
- ✅ You want complete technology freedom per zone (though all will still be Shipkit-based)

### Choose **Next.js Multi-Zone** if

- ✅ You want optimal performance for shipkit.io users
- ✅ You need soft navigation within zones (e.g., within documentation)
- ✅ You're comfortable with more complex setup
- ✅ You want to leverage Shipkit's full feature set in each zone

### Choose **Modified Shipkit Config** if

- ✅ You want to keep your current shipkit.io setup mostly intact
- ✅ You only need a few additional zones (start with docs or blog)
- ✅ You want gradual migration to multi-zone architecture

## Recommended Architecture for Shipkit.io

### 🚀 Recommended: Next.js Multi-Zone with Shipkit

**Shipkit.io Zone Structure:**

```
shipkit.io/          -> Main Shipkit app (marketing, dashboard, auth)
shipkit.io/docs/*    -> Documentation Shipkit app (customized for docs)
shipkit.io/blog/*    -> Blog Shipkit app (customized for blogging)
shipkit.io/ui/*      -> UI Component Library Shipkit app (component showcase)
shipkit.io/tools/*   -> Developer Tools Shipkit app (interactive utilities)
```

**Step 1: Add rewrites to your current `next.config.ts`**

```typescript
// Add to your existing next.config.ts
async rewrites() {
  const multiZoneRewrites = [];

  // Documentation Zone
  if (process.env.DOCS_DOMAIN) {
    multiZoneRewrites.push(
      { source: '/docs', destination: `${process.env.DOCS_DOMAIN}/docs` },
      { source: '/docs/:path*', destination: `${process.env.DOCS_DOMAIN}/docs/:path*` },
      { source: '/docs-static/:path*', destination: `${process.env.DOCS_DOMAIN}/docs-static/:path*` }
    );
  }

  // Blog Zone
  if (process.env.BLOG_DOMAIN) {
    multiZoneRewrites.push(
      { source: '/blog', destination: `${process.env.BLOG_DOMAIN}/blog` },
      { source: '/blog/:path*', destination: `${process.env.BLOG_DOMAIN}/blog/:path*` },
      { source: '/blog-static/:path*', destination: `${process.env.BLOG_DOMAIN}/blog-static/:path*` }
    );
  }

  // UI Library Zone
  if (process.env.UI_DOMAIN) {
    multiZoneRewrites.push(
      { source: '/ui', destination: `${process.env.UI_DOMAIN}/ui` },
      { source: '/ui/:path*', destination: `${process.env.UI_DOMAIN}/ui/:path*` },
      { source: '/ui-static/:path*', destination: `${process.env.UI_DOMAIN}/ui-static/:path*` }
    );
  }

  // Developer Tools Zone
  if (process.env.TOOLS_DOMAIN) {
    multiZoneRewrites.push(
      { source: '/tools', destination: `${process.env.TOOLS_DOMAIN}/tools` },
      { source: '/tools/:path*', destination: `${process.env.TOOLS_DOMAIN}/tools/:path*` },
      { source: '/tools-static/:path*', destination: `${process.env.TOOLS_DOMAIN}/tools-static/:path*` }
    );
  }

  return multiZoneRewrites;
}
```

**Step 2: Create secondary Shipkit apps for Shipkit.io**

```bash
# Documentation Shipkit app
git clone https://github.com/lacymorrow/shipkit.git shipkit-docs
cd shipkit-docs && bun install --frozen-lockfile

# Blog Shipkit app
git clone https://github.com/lacymorrow/shipkit.git shipkit-blog
cd shipkit-blog && bun install --frozen-lockfile

# UI Component Library Shipkit app
git clone https://github.com/lacymorrow/shipkit.git shipkit-ui
cd shipkit-ui && bun install --frozen-lockfile

# Developer Tools Shipkit app
git clone https://github.com/lacymorrow/shipkit.git shipkit-tools
cd shipkit-tools && bun install --frozen-lockfile
```

**Step 3: Configure each Shipkit app for its zone**

```typescript
// Each Shipkit app gets customized next.config.ts
const nextConfig: NextConfig = {
  env: {
    ...buildTimeFeatureFlags,
  },
  redirects,

  // Zone-specific configuration
  assetPrefix: "/docs-static", // or /blog-static, /ui-static, /tools-static
  basePath: "/docs", // or /blog, /ui, /tools

  // Rest of Shipkit configuration with zone customizations
  // ... existing Shipkit config
};

export default withPlugins(nextConfig);
```

**Step 4: Deploy and configure**

1. Deploy each Shipkit app to Vercel with zone-specific names
2. Set environment variables pointing to deployed Shipkit URLs
3. Assign shipkit.io domain to the main Shipkit app

## Environment Variables Template for Shipkit.io

### Main Shipkit App

```bash
# Development (.env.local)
DOCS_DOMAIN=http://localhost:3001
BLOG_DOMAIN=http://localhost:3002
UI_DOMAIN=http://localhost:3003
TOOLS_DOMAIN=http://localhost:3004

# Production (Vercel Dashboard)
DOCS_DOMAIN=https://docs-shipkit.vercel.app
BLOG_DOMAIN=https://blog-shipkit.vercel.app
UI_DOMAIN=https://ui-shipkit.vercel.app
TOOLS_DOMAIN=https://tools-shipkit.vercel.app
```

### Zone-Specific Environment Variables

```bash
# shipkit-docs/.env.local
NEXT_PUBLIC_APP_URL=http://localhost:3001
DATABASE_URL=your_docs_database_url  # Can share or separate
ADMIN_EMAIL=admin@shipkit.io
NEXTAUTH_SECRET=your_auth_secret
# Docs-specific variables
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key

# shipkit-blog/.env.local
NEXT_PUBLIC_APP_URL=http://localhost:3002
DATABASE_URL=your_blog_database_url
ADMIN_EMAIL=admin@shipkit.io
NEXTAUTH_SECRET=your_auth_secret
# Blog-specific variables
CMS_API_URL=your_cms_api_url

# And so on for other zones...
```

## File Structure After Setup

```
shipkit.io/
├── shipkit/ (main app - your current project)
│   ├── src/
│   ├── next.config.ts (modified with rewrites)
│   └── ...
├── shipkit-docs/ (full Shipkit installation for docs)
│   ├── src/
│   ├── next.config.ts (with basePath: '/docs')
│   └── ... (full Shipkit structure, customized for docs)
├── shipkit-blog/ (full Shipkit installation for blog)
│   ├── src/
│   ├── next.config.ts (with basePath: '/blog')
│   └── ... (full Shipkit structure, customized for blog)
├── shipkit-ui/ (full Shipkit installation for UI library)
│   ├── src/
│   ├── next.config.ts (with basePath: '/ui')
│   └── ... (full Shipkit structure, customized for UI)
└── shipkit-tools/ (full Shipkit installation for tools)
    ├── src/
    ├── next.config.ts (with basePath: '/tools')
    └── ... (full Shipkit structure, customized for tools)
```

## Navigation Best Practices for Shipkit.io

```tsx
// ✅ Within any Shipkit zone (soft navigation within zone)
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>
<Link href="/pricing">Pricing</Link>
<Link href="/features">Features</Link>

// ✅ Between zones (hard navigation with consistent Shipkit styling)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

<Button asChild variant="outline">
  <a href="/docs/getting-started">
    Read Documentation
  </a>
</Button>

<Button asChild variant="secondary">
  <a href="/blog/latest-updates">
    Latest Blog Posts
  </a>
</Button>

<Button asChild>
  <a href="/ui/components/button">
    Browse UI Components
  </a>
</Button>

<Button asChild variant="default">
  <a href="/tools/api-tester">
    Developer Tools
  </a>
</Button>
```

## Testing Your Shipkit.io Setup

### Local Development

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

### Verification Checklist for Shipkit.io

- [ ] Main shipkit.io loads with marketing and dashboard
- [ ] `/docs/*` routes proxy to documentation Shipkit app
- [ ] `/blog/*` routes proxy to blog Shipkit app
- [ ] `/ui/*` routes proxy to UI component library Shipkit app
- [ ] `/tools/*` routes proxy to developer tools Shipkit app
- [ ] Consistent Shipkit branding and components across all zones
- [ ] Authentication state works across zones (if shared)
- [ ] All Shipkit features available in appropriate zones

## Deployment Checklist for Shipkit.io

### Pre-deployment

- [ ] All Shipkit apps build successfully locally
- [ ] Shipkit.io environment variables configured for all zones
- [ ] Asset prefixes are unique per zone
- [ ] Cross-zone links use `<a>` tags with consistent Shipkit styling
- [ ] Zone-specific Shipkit customizations are working

### Vercel Deployment

- [ ] Deploy main Shipkit app to Vercel
- [ ] Deploy shipkit-docs Shipkit app to Vercel
- [ ] Deploy shipkit-blog Shipkit app to Vercel
- [ ] Deploy shipkit-ui Shipkit app to Vercel
- [ ] Deploy shipkit-tools Shipkit app to Vercel
- [ ] Set zone environment variables in main Shipkit app
- [ ] Assign shipkit.io domain to main Shipkit app

### Post-deployment

- [ ] Verify all shipkit.io zones load correctly
- [ ] Check asset loading across all zones (no 404s)
- [ ] Test cross-zone navigation from main app
- [ ] Verify SEO meta tags for each zone (using Shipkit's SEO features)
- [ ] Monitor performance metrics for each zone
- [ ] Test authentication flow across zones (if shared)

## Shipkit.io Zone Content Strategy

### Documentation Zone (`/docs/*`) - Shipkit Customization

- **Keep**: Authentication, admin panel, user management
- **Remove**: E-commerce, marketing landing pages
- **Add**: Enhanced MDX processing, search functionality, API docs
- **Leverage**: Shipkit's built-in SEO, analytics, monitoring

### Blog Zone (`/blog/*`) - Shipkit Customization

- **Keep**: Authentication, user profiles, commenting system
- **Remove**: Complex dashboard features, e-commerce
- **Add**: Enhanced blog features, social sharing, RSS feeds
- **Leverage**: Shipkit's CMS integration, analytics

### UI Library Zone (`/ui/*`) - Shipkit Customization

- **Keep**: Full component library, theming system
- **Focus**: Component showcase, interactive demos, documentation
- **Add**: Storybook integration, code copying, accessibility docs
- **Leverage**: All of Shipkit's UI components and design system

### Developer Tools Zone (`/tools/*`) - Shipkit Customization

- **Keep**: Authentication, file handling, API endpoints
- **Focus**: Interactive developer utilities and tools
- **Add**: Monaco Editor, API testing, schema validation
- **Leverage**: Shipkit's server actions, file upload capabilities

## Benefits of Shipkit Multi-Zone Architecture

### Technical Benefits

- ✅ **Consistent design system** across all zones using Shipkit components
- ✅ **Shared authentication** and user management system
- ✅ **Reusable components** and utilities across zones
- ✅ **Type safety** with shared TypeScript configuration
- ✅ **Built-in monitoring** and analytics across all zones
- ✅ **SEO optimization** using Shipkit's built-in features

### Development Benefits

- ✅ **Familiar development experience** across all zones
- ✅ **Shared configuration** and best practices
- ✅ **Easy maintenance** with consistent codebase structure
- ✅ **Component library** available in all zones
- ✅ **Integrated tooling** (ESLint, Prettier, TypeScript)

### Business Benefits

- ✅ **Faster development** with proven Shipkit foundation
- ✅ **Consistent branding** across all touchpoints
- ✅ **Scalable architecture** that grows with your needs
- ✅ **Independent deployments** for different content types
- ✅ **Team specialization** with consistent tooling

## Next Steps for Shipkit.io

1. **Start with documentation zone** - Clone Shipkit and customize for docs
2. **Extract existing content** from current Shipkit app to appropriate zones
3. **Customize each Shipkit installation** for its specific purpose
4. **Set up shared services** (authentication, database, analytics)
5. **Test thoroughly** before production deployment
6. **Monitor and optimize** each zone independently

## Files Created for Shipkit.io

- `proxy-vercel.json` - Shipkit.io proxy configuration
- `./multi-zone-setup.md` - Detailed Shipkit.io setup guide using Shipkit for all zones
- `example-multi-zone-config.ts` - Modified next.config.ts for main Shipkit app
- `multi-zone-env-example.md` - Shipkit.io environment variables and deployment
- `multi-zone-summary.md` - This comprehensive Shipkit.io implementation guide

This multi-zone architecture leverages Shipkit's full feature set across all zones while allowing for specialized functionality in each zone. Each zone benefits from Shipkit's built-in authentication, monitoring, SEO, and component library while being optimized for its specific purpose.
