---
title: "Multi-Zone Setup Guide for Shipkit.io"
description: "A comprehensive guide for setting up multi-zone deployments with Shipkit, covering zone configuration, routing, and deployment strategies."
---

# Multi-Zone Setup Guide for Shipkit.io

## Overview

This guide will help you set up a multi-zone architecture for Shipkit.io where different Shipkit applications serve different paths on shipkit.io. Each zone will be a complete Shipkit installation, customized for its specific purpose.

## Architecture Example

```
shipkit.io/          -> Main Shipkit app (marketing, landing, dashboard)
shipkit.io/docs/*    -> Documentation Shipkit app (customized for docs)
shipkit.io/blog/*    -> Blog Shipkit app (customized for blogging)
shipkit.io/ui/*      -> UI Component Library Shipkit app (component showcase)
shipkit.io/tools/*   -> Developer Tools Shipkit app (interactive utilities)
```

## Step 1: Configure the Main App (Current Shipkit)

Since your main app will handle routing to other zones, add rewrites to your `next.config.ts`:

```typescript
// Add this to your existing next.config.ts
async rewrites() {
  const multiZoneRewrites = [];

  // Documentation Zone - Routes /docs/* to a separate Shipkit docs app
  if (process.env.DOCS_DOMAIN) {
    multiZoneRewrites.push(
      {
        source: '/docs',
        destination: `${process.env.DOCS_DOMAIN}/docs`,
      },
      {
        source: '/docs/:path+',
        destination: `${process.env.DOCS_DOMAIN}/docs/:path+`,
      },
      {
        source: '/docs-static/:path+',
        destination: `${process.env.DOCS_DOMAIN}/docs-static/:path+`,
      }
    );
  }

  // Blog Zone - Routes /blog/* to a separate Shipkit blog app
  if (process.env.BLOG_DOMAIN) {
    multiZoneRewrites.push(
      {
        source: '/blog',
        destination: `${process.env.BLOG_DOMAIN}/blog`,
      },
      {
        source: '/blog/:path+',
        destination: `${process.env.BLOG_DOMAIN}/blog/:path+`,
      },
      {
        source: '/blog-static/:path+',
        destination: `${process.env.BLOG_DOMAIN}/blog-static/:path+`,
      }
    );
  }

  // UI Component Library Zone - Routes /ui/* to a separate Shipkit UI app
  if (process.env.UI_DOMAIN) {
    multiZoneRewrites.push(
      {
        source: '/ui',
        destination: `${process.env.UI_DOMAIN}/ui`,
      },
      {
        source: '/ui/:path+',
        destination: `${process.env.UI_DOMAIN}/ui/:path+`,
      },
      {
        source: '/ui-static/:path+',
        destination: `${process.env.UI_DOMAIN}/ui-static/:path+`,
      }
    );
  }

  // Developer Tools Zone - Routes /tools/* to a separate Shipkit tools app
  if (process.env.TOOLS_DOMAIN) {
    multiZoneRewrites.push(
      {
        source: '/tools',
        destination: `${process.env.TOOLS_DOMAIN}/tools`,
      },
      {
        source: '/tools/:path+',
        destination: `${process.env.TOOLS_DOMAIN}/tools/:path+`,
      },
      {
        source: '/tools-static/:path+',
        destination: `${process.env.TOOLS_DOMAIN}/tools-static/:path+`,
      }
    );
  }

  return multiZoneRewrites;
}
```

## Step 2: Create Secondary Shipkit Apps

### Documentation Shipkit App

Create a new Shipkit installation for documentation:

```bash
# Clone Shipkit for documentation
git clone https://github.com/lacymorrow/shipkit.git shipkit-docs
cd shipkit-docs

# Install dependencies
bun install --frozen-lockfile

# Customize for documentation
# Remove unnecessary features, add docs-specific functionality
```

**Configure `next.config.ts`**:

```typescript
// shipkit-docs/next.config.ts
import { buildTimeFeatureFlags } from "@/config/features-config";
import { FILE_UPLOAD_MAX_SIZE } from "@/config/file";
import { redirects } from "@/config/routes";
import { withPlugins } from "@/config/with-plugins";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ...buildTimeFeatureFlags,
  },
  redirects,

  // Multi-zone configuration for docs
  assetPrefix: "/docs-static",
  basePath: "/docs",

  // For Next.js versions < 15, add this rewrite
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
  images: {
    remotePatterns: [
      { hostname: "shipkit.io" },
      { hostname: "github.com" },
      { hostname: "raw.githubusercontent.com" },
      // ... other patterns
    ],
  },

  // ... rest of your Shipkit config
};

export default withPlugins(nextConfig);
```

### Blog Shipkit App

```bash
# Clone Shipkit for blog
git clone https://github.com/lacymorrow/shipkit.git shipkit-blog
cd shipkit-blog

# Install dependencies
bun install --frozen-lockfile

# Customize for blogging
# Enable blog-specific features, add CMS integration
```

**Configure `next.config.ts`**:

```typescript
// shipkit-blog/next.config.ts
const nextConfig: NextConfig = {
  env: {
    ...buildTimeFeatureFlags,
  },
  redirects,

  // Multi-zone configuration for blog
  assetPrefix: "/blog-static",
  basePath: "/blog",

  // Blog-specific optimizations
  images: {
    remotePatterns: [
      { hostname: "shipkit.io" },
      { hostname: "images.unsplash.com" },
      { hostname: "avatars.githubusercontent.com" },
      // ... other patterns for blog content
    ],
  },

  // For Next.js versions < 15
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/blog-static/_next/:path+",
          destination: "/_next/:path+",
        },
      ],
    };
  },

  // ... rest of Shipkit config
};
```

### UI Component Library Shipkit App

```bash
# Clone Shipkit for UI library
git clone https://github.com/lacymorrow/shipkit.git shipkit-ui
cd shipkit-ui

# Install dependencies
bun install --frozen-lockfile

# Add component showcase dependencies
bun add @storybook/nextjs @storybook/addon-docs
```

**Configure `next.config.ts`**:

```typescript
// shipkit-ui/next.config.ts
const nextConfig: NextConfig = {
  env: {
    ...buildTimeFeatureFlags,
  },
  redirects,

  // Multi-zone configuration for UI library
  assetPrefix: "/ui-static",
  basePath: "/ui",

  // UI showcase optimizations
  experimental: {
    ...buildTimeFeatureFlags,
    mdxRs: true, // For component documentation
  },

  // For Next.js versions < 15
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/ui-static/_next/:path+",
          destination: "/_next/:path+",
        },
      ],
    };
  },

  // ... rest of Shipkit config
};
```

### Developer Tools Shipkit App

```bash
# Clone Shipkit for tools
git clone https://github.com/lacymorrow/shipkit.git shipkit-tools
cd shipkit-tools

# Install dependencies
bun install --frozen-lockfile

# Add tools-specific dependencies
bun add @monaco-editor/react @codemirror/state @codemirror/view
```

**Configure `next.config.ts`**:

```typescript
// shipkit-tools/next.config.ts
const nextConfig: NextConfig = {
  env: {
    ...buildTimeFeatureFlags,
  },
  redirects,

  // Multi-zone configuration for tools
  assetPrefix: "/tools-static",
  basePath: "/tools",

  // Tools-specific optimizations
  experimental: {
    ...buildTimeFeatureFlags,
    serverActions: {
      bodySizeLimit: "10mb", // For file uploads in tools
    },
  },

  // Support for tools that might need WASM
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },

  // For Next.js versions < 15
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/tools-static/_next/:path+",
          destination: "/_next/:path+",
        },
      ],
    };
  },

  // ... rest of Shipkit config
};
```

## Step 3: Environment Variables

Add these to your main Shipkit app's `.env.local`:

```bash
# Multi-Zone Development Configuration for Shipkit.io
DOCS_DOMAIN=http://localhost:3001
BLOG_DOMAIN=http://localhost:3002
UI_DOMAIN=http://localhost:3003
TOOLS_DOMAIN=http://localhost:3004

# Your existing Shipkit environment variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=your_database_url
ADMIN_EMAIL=admin@shipkit.io
NEXTAUTH_SECRET=your_auth_secret
# ... other existing variables
```

**For each zone app, create separate `.env.local` files with zone-specific configurations:**

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

## Step 4: Customize Each Shipkit Zone

### Documentation Zone Customization

**Remove unnecessary features:**

- E-commerce components
- Marketing landing pages
- Dashboard features (unless needed for docs admin)

**Add documentation features:**

- Enhanced MDX processing
- Search functionality (Algolia DocSearch)
- Code syntax highlighting
- API reference generation
- Versioning support

**Customize routes in `src/config/routes.ts`:**

```typescript
// shipkit-docs/src/config/routes.ts
export const routes = {
  // Documentation-specific routes
  home: "/docs", // Base path is /docs
  gettingStarted: "/docs/getting-started",
  apiReference: "/docs/api",
  components: "/docs/components",
  deployment: "/docs/deployment",
  // ... other doc routes
};
```

### Blog Zone Customization

**Remove unnecessary features:**

- Complex dashboard features
- E-commerce components
- Advanced admin tools

**Add blogging features:**

- Enhanced MDX for blog posts
- Author profiles
- Categories and tags
- RSS feed generation
- Social sharing
- Comments system (optional)

### UI Library Zone Customization

**Focus on component showcase:**

- Interactive component demos
- Code copying functionality
- Theme switcher
- Component API documentation
- Usage examples
- Accessibility information

### Tools Zone Customization

**Add developer tools:**

- API testing interface
- Schema validators
- Code generators
- Performance analyzers
- Bundle size analyzers

## Step 5: Cross-Zone Navigation with Shared Shipkit Components

Since all zones use Shipkit, you can share components while maintaining zone-specific navigation:

```tsx
// In any zone, use Shipkit's navigation components
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Cross-zone navigation using Shipkit styling
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
```

## Step 6: Deployment Strategy

1. **Deploy each Shipkit app separately to Vercel**
   - Main Shipkit app: `shipkit-main.vercel.app`
   - Documentation Shipkit app: `shipkit-docs.vercel.app`
   - Blog Shipkit app: `shipkit-blog.vercel.app`
   - UI Library Shipkit app: `shipkit-ui.vercel.app`
   - Tools Shipkit app: `shipkit-tools.vercel.app`

2. **Configure environment variables for each zone**
3. **Assign shipkit.io domain to the main Shipkit app**

## Benefits of Using Shipkit for All Zones

- ✅ **Consistent design system** across all zones
- ✅ **Shared authentication** and user management
- ✅ **Reusable components** and utilities
- ✅ **Consistent development experience**
- ✅ **Easy maintenance** and updates
- ✅ **Built-in features** (analytics, monitoring, etc.)
- ✅ **Type safety** across all zones
- ✅ **Shared configuration** and best practices

## Zone-Specific Features Available

Since each zone is a full Shipkit installation, you can selectively enable/disable features:

- **Authentication**: Can be shared or zone-specific
- **Database**: Can share tables or use separate databases
- **Analytics**: Consistent tracking across zones
- **Monitoring**: Built-in error tracking and performance monitoring
- **SEO**: Shipkit's built-in SEO optimizations
- **Performance**: All of Shipkit's performance optimizations

## Considerations

- ❌ **Larger bundle sizes** per zone (but each optimized for its purpose)
- ❌ **More complex deployment** (multiple Shipkit apps)
- ✅ **Maximum flexibility** and feature richness per zone
- ✅ **Easier long-term maintenance** with consistent codebase
