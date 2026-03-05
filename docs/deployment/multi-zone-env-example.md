---
title: "Multi-Zone Environment Variables & Deployment for Shipkit.io"
description: "Comprehensive guide for configuring environment variables and deployment settings for multi-zone Shipkit.io applications across different domains and environments."
---

# Multi-Zone Environment Variables & Deployment for Shipkit.io

## Environment Variables

### For Development (.env.local)

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

### For Production (Vercel Environment Variables)

```bash
# Multi-Zone Production Configuration for Shipkit.io
DOCS_DOMAIN=https://docs-shipkit.vercel.app
BLOG_DOMAIN=https://blog-shipkit.vercel.app
UI_DOMAIN=https://ui-shipkit.vercel.app
TOOLS_DOMAIN=https://tools-shipkit.vercel.app

# Your existing Shipkit production variables
NEXT_PUBLIC_APP_URL=https://shipkit.io
DATABASE_URL=your_production_database_url
ADMIN_EMAIL=admin@shipkit.io,team@shipkit.io
NEXTAUTH_SECRET=your_production_auth_secret
# ... other existing variables
```

## Deployment Strategy Options

### Option 1: Vercel Proxy Project (Simplest)

1. **Create 5 separate repositories:**
   - `shipkit-main` (Current Shipkit repo)
   - `shipkit-docs` (Documentation app with Nextra/MDX)
   - `shipkit-blog` (Blog app with MDX/CMS)
   - `shipkit-ui` (UI component library showcase)
   - `shipkit-tools` (Developer tools and utilities)

2. **Deploy each as separate Vercel projects:**

   ```bash
   # Deploy main Shipkit app
   vercel --prod

   # Deploy docs app
   cd ../shipkit-docs
   vercel --prod

   # Deploy blog app
   cd ../shipkit-blog
   vercel --prod

   # Deploy UI library
   cd ../shipkit-ui
   vercel --prod

   # Deploy tools app
   cd ../shipkit-tools
   vercel --prod
   ```

3. **Create proxy project:**

   ```bash
   mkdir shipkit-io-proxy
   cd shipkit-io-proxy
   # Copy the proxy-vercel.json content to vercel.json
   vercel --prod
   ```

4. **Assign shipkit.io domain to the proxy project**

### Option 2: Next.js Multi-Zone (Recommended for Shipkit.io)

1. **Deploy each app separately to Vercel**
2. **Set environment variables on main Shipkit app:**
   - `DOCS_DOMAIN=https://docs-shipkit.vercel.app`
   - `BLOG_DOMAIN=https://blog-shipkit.vercel.app`
   - `UI_DOMAIN=https://ui-shipkit.vercel.app`
   - `TOOLS_DOMAIN=https://tools-shipkit.vercel.app`
3. **Assign shipkit.io domain to the main Shipkit app**

### Option 3: Modified Shipkit Configuration (Incremental Approach)

1. **Add the rewrites to your existing `next.config.ts`** (see example-multi-zone-config.ts)
2. **Set environment variables in Vercel dashboard**
3. **Deploy normally with `vercel --prod`**

## Secondary App Configuration Examples

### Documentation App (shipkit-docs/next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: "/docs-static",
  basePath: "/docs",

  // Optimized for documentation
  images: {
    remotePatterns: [
      { hostname: "shipkit.io" },
      { hostname: "github.com" },
      { hostname: "raw.githubusercontent.com" },
    ],
  },

  // MDX support for documentation
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  // Rewrites for static assets (Next.js < 15)
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
};

export default nextConfig;
```

### Blog App (shipkit-blog/next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: "/blog-static",
  basePath: "/blog",

  // Optimized for blog content
  images: {
    remotePatterns: [
      { hostname: "shipkit.io" },
      { hostname: "images.unsplash.com" },
      { hostname: "avatars.githubusercontent.com" },
    ],
  },

  // MDX support for blog posts
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  // Rewrites for static assets (Next.js < 15)
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
};

export default nextConfig;
```

### UI Component Library (shipkit-ui/next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: "/ui-static",
  basePath: "/ui",

  // Optimized for component showcase
  images: {
    remotePatterns: [{ hostname: "shipkit.io" }, { hostname: "ui.shadcn.com" }],
  },

  // Support for component demos
  experimental: {
    mdxRs: true,
  },

  // Rewrites for static assets (Next.js < 15)
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
};

export default nextConfig;
```

### Developer Tools (shipkit-tools/next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: "/tools-static",
  basePath: "/tools",

  // Optimized for interactive tools
  experimental: {
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

  // Rewrites for static assets (Next.js < 15)
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
};

export default nextConfig;
```

## Testing Multi-Zone Setup

### Local Development

1. **Start each app on different ports:**

   ```bash
   # Terminal 1 - Main Shipkit app
   bun dev

   # Terminal 2 - Documentation app
   cd ../shipkit-docs && bun dev -- --port 3001

   # Terminal 3 - Blog app
   cd ../shipkit-blog && bun dev -- --port 3002

   # Terminal 4 - UI Library
   cd ../shipkit-ui && bun dev -- --port 3003

   # Terminal 5 - Tools app
   cd ../shipkit-tools && bun dev -- --port 3004
   ```

2. **Test routes:**
   - `http://localhost:3000/` → Main Shipkit app (marketing, dashboard)
   - `http://localhost:3000/docs` → Should proxy to documentation app
   - `http://localhost:3000/blog` → Should proxy to blog app
   - `http://localhost:3000/ui` → Should proxy to UI library
   - `http://localhost:3000/tools` → Should proxy to tools app

### Production Testing

1. **Deploy all apps**
2. **Set environment variables**
3. **Test shipkit.io routes:**
   - `https://shipkit.io/` → Main app
   - `https://shipkit.io/docs/getting-started` → Documentation
   - `https://shipkit.io/blog/latest-update` → Blog
   - `https://shipkit.io/ui/components/button` → UI Library
   - `https://shipkit.io/tools/api-tester` → Developer Tools

## Shipkit.io Specific Use Cases

### Documentation App Features

- **Getting Started Guide** - Onboarding for new users
- **API Documentation** - Complete API reference
- **Component Documentation** - Usage guides for UI components
- **Integration Guides** - Third-party service integrations
- **Changelog** - Version history and updates

### Blog App Features

- **Product Announcements** - New feature releases
- **Technical Deep Dives** - Engineering insights
- **Case Studies** - Customer success stories
- **Tutorials** - Step-by-step guides
- **Company Updates** - News and milestones

### UI Library Features

- **Component Gallery** - Interactive component demos
- **Design System** - Colors, typography, spacing
- **Code Examples** - Copy-paste ready snippets
- **Theming Guide** - Customization instructions
- **Accessibility Guidelines** - WCAG compliance info

### Developer Tools Features

- **API Tester** - Interactive API exploration
- **Schema Validator** - JSON/OpenAPI validation
- **Code Generator** - Template and boilerplate generation
- **Performance Analyzer** - Bundle size and performance metrics
- **CLI Documentation** - Command-line tool reference

## Common Gotchas for Shipkit.io

1. **SEO Considerations**: Each zone should have proper meta tags and sitemap
2. **Analytics**: Ensure tracking works across all zones
3. **Authentication**: Consider if users need to stay logged in across zones
4. **Shared Components**: Plan how to share Shipkit components across zones
5. **Branding Consistency**: Maintain consistent design across all zones

## Performance Considerations

- **Documentation**: Optimize for content delivery and search
- **Blog**: Focus on reading experience and social sharing
- **UI Library**: Prioritize component loading and interactivity
- **Tools**: Optimize for large file uploads and complex calculations
- **Main App**: Balance between marketing and application performance
