---
description:
globs:
alwaysApply: false
---
# Multi-Zone Architecture Rules

## Overview

Multi-zone architecture allows Shipkit applications to be split into multiple Next.js applications while appearing as a single domain to users. This pattern is ideal for:

- **Scalability**: Different teams can work on different zones independently
- **Performance**: Each zone can be optimized for its specific use case
- **Deployment**: Zones can be deployed and updated independently
- **Technology Freedom**: Each zone can use different technologies while maintaining consistency

## Zone Configuration Patterns

### Standard Zone Structure
```
domain.com/          → Main app (marketing, dashboard, auth)
domain.com/docs/*    → Documentation zone
domain.com/blog/*    → Blog zone
domain.com/ui/*      → UI component library zone
domain.com/tools/*   → Developer tools zone
```

### Zone Types

#### 1. Main Zone (Primary Application)
- **Purpose**: Core application functionality
- **Contains**: Authentication, dashboard, marketing pages, API routes
- **Routing**: Handles all routes not claimed by other zones
- **Configuration**: Standard Shipkit configuration with multi-zone rewrites

#### 2. Documentation Zone
- **Purpose**: Product documentation, guides, API reference
- **Features**: Search functionality, versioning, navigation tree
- **Content**: MDX files, code examples, tutorials
- **Optimization**: Static generation, fast search indexing

#### 3. Blog Zone
- **Purpose**: Blog posts, announcements, case studies
- **Features**: CMS integration, commenting, social sharing
- **Content**: Articles, author profiles, categories
- **Optimization**: SEO optimization, RSS feeds

#### 4. UI Component Library Zone
- **Purpose**: Component showcase, design system documentation
- **Features**: Interactive component playground, code examples
- **Content**: Component demos, design tokens, usage guidelines
- **Optimization**: Component isolation, visual regression testing

#### 5. Developer Tools Zone
- **Purpose**: Interactive utilities, API explorers, validators
- **Features**: Real-time tools, code generators, testing utilities
- **Content**: Interactive forms, API documentation, utilities
- **Optimization**: Client-side interactivity, tool performance

## Implementation Patterns

### 1. Zone Setup

#### Directory Structure
```
project-root/
├── shipkit/              # Main application
├── shipkit-docs/         # Documentation zone
├── shipkit-blog/         # Blog zone
├── shipkit-ui/           # UI library zone
└── shipkit-tools/        # Tools zone
```

#### Zone Creation Commands
```bash
# Create zones by cloning Shipkit
git clone https://github.com/lacymorrow/shipkit.git shipkit-docs
git clone https://github.com/lacymorrow/shipkit.git shipkit-blog
git clone https://github.com/lacymorrow/shipkit.git shipkit-ui
git clone https://github.com/lacymorrow/shipkit.git shipkit-tools

# Install dependencies for each zone
cd shipkit-docs && bun install --frozen-lockfile
cd shipkit-blog && bun install --frozen-lockfile
cd shipkit-ui && bun install --frozen-lockfile
cd shipkit-tools && bun install --frozen-lockfile
```

### 2. Configuration Patterns

#### Main Zone Configuration (next.config.ts)
```typescript
async rewrites() {
  const multiZoneRewrites = [];

  // Documentation Zone
  if (process.env.DOCS_DOMAIN) {
    multiZoneRewrites.push(
      { source: '/docs', destination: `${process.env.DOCS_DOMAIN}/docs` },
      { source: '/docs/:path*', destination: `${process.env.DOCS_DOMAIN}/docs/:path*` }
    );
  }

  // Add other zones similarly...

  return multiZoneRewrites;
}
```

#### Zone-Specific Configuration
```typescript
// Each zone's next.config.ts
const nextConfig: NextConfig = {
  basePath: '/docs', // or /blog, /ui, /tools
  assetPrefix: '/docs-static', // or /blog-static, etc.

  // Inherit all Shipkit configurations
  ...existingShipkitConfig,
};
```

### 3. Environment Variables

#### Development Environment
```bash
# Main app .env.local
DOCS_DOMAIN=http://localhost:3001
BLOG_DOMAIN=http://localhost:3002
UI_DOMAIN=http://localhost:3003
TOOLS_DOMAIN=http://localhost:3004
```

#### Production Environment
```bash
# Main app production environment
DOCS_DOMAIN=https://docs-shipkit.vercel.app
BLOG_DOMAIN=https://blog-shipkit.vercel.app
UI_DOMAIN=https://ui-shipkit.vercel.app
TOOLS_DOMAIN=https://tools-shipkit.vercel.app
```

## Navigation Patterns

### Inter-Zone Navigation
```tsx
// Use anchor tags for navigation between zones
<a href="/docs/getting-started" className="nav-link">
  Documentation
</a>

// NOT Next.js Link for cross-zone navigation
// ❌ <Link href="/docs/getting-started">Documentation</Link>
```

### Intra-Zone Navigation
```tsx
// Use Next.js Link within the same zone
import Link from 'next/link'

<Link href="/docs/advanced-topics">
  Advanced Topics
</Link>
```

### Shared Navigation Components
```tsx
// Create zone-aware navigation components
const NavLink = ({ href, children, ...props }) => {
  const isExternal = href.startsWith('/docs') ||
                    href.startsWith('/blog') ||
                    href.startsWith('/ui') ||
                    href.startsWith('/tools');

  if (isExternal) {
    return <a href={href} {...props}>{children}</a>;
  }

  return <Link href={href} {...props}>{children}</Link>;
};
```

## Content Management

### Content Organization
```
content/
├── docs/
│   ├── getting-started/
│   ├── api-reference/
│   └── tutorials/
├── blog/
│   ├── announcements/
│   ├── technical/
│   └── case-studies/
├── ui/
│   ├── components/
│   ├── design-tokens/
│   └── guidelines/
└── tools/
    ├── validators/
    ├── generators/
    └── utilities/
```

### Shared Content Strategy
- Use consistent frontmatter across zones
- Implement shared content validation schemas
- Maintain consistent tagging and categorization
- Use shared asset management

## Authentication & State Management

### Shared Authentication
```typescript
// Configure NextAuth to work across zones
export const authOptions: NextAuthOptions = {
  // Ensure cookies work across subdomains/zones
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        domain: '.yourdomain.com', // Note the leading dot
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
};
```

### Cross-Zone State
- Use URL parameters for sharable state
- Implement local storage for user preferences
- Use session storage for temporary data
- Avoid complex state synchronization between zones

## Performance Optimization

### Zone-Specific Optimizations

#### Documentation Zone
- Static generation for all content
- Search index optimization
- Image optimization for diagrams
- CDN caching for assets

#### Blog Zone
- ISR for blog posts
- Image optimization for featured images
- Social media meta tags
- RSS feed generation

#### UI Zone
- Component isolation
- Visual regression testing
- Performance monitoring for interactive demos
- Lazy loading for component examples

#### Tools Zone
- Client-side rendering for interactive tools
- WebAssembly for performance-critical operations
- Service worker for offline functionality
- Real-time updates where needed

## Deployment Strategy

### Vercel Deployment Pattern
```bash
# Deploy each zone to Vercel with descriptive names
vercel --prod --name="main-shipkit"      # Main application
vercel --prod --name="docs-shipkit"      # Documentation
vercel --prod --name="blog-shipkit"      # Blog
vercel --prod --name="ui-shipkit"        # UI Library
vercel --prod --name="tools-shipkit"     # Tools
```

### Environment Configuration
1. Deploy each zone as separate Vercel project
2. Configure custom domains or use Vercel URLs
3. Set environment variables in main app pointing to zone URLs
4. Configure main domain to point to primary application
5. Test cross-zone navigation and functionality

## Testing Strategy

### Zone-Specific Testing
- Unit tests for each zone's components
- Integration tests for zone functionality
- E2E tests for cross-zone navigation
- Performance tests for each zone
- Accessibility tests across all zones

### Cross-Zone Testing
```typescript
// Example E2E test for cross-zone navigation
test('navigation from main to docs zone', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/docs"]');
  await expect(page.url()).toContain('/docs');
  await expect(page.locator('h1')).toContainText('Documentation');
});
```

## Monitoring & Analytics

### Zone-Specific Monitoring
- Performance monitoring for each zone
- Error tracking per zone
- User analytics per zone
- SEO monitoring for content zones

### Shared Monitoring
- User journey tracking across zones
- Conversion funnel analysis
- Performance comparison between zones
- Cross-zone search analytics

## Best Practices

### Do's
✅ Use consistent design system across all zones
✅ Implement shared authentication
✅ Monitor performance of each zone independently
✅ Use environment variables for zone configuration
✅ Test cross-zone navigation thoroughly
✅ Implement proper error boundaries per zone
✅ Use consistent logging and monitoring
✅ Document zone-specific configuration

### Don'ts
❌ Use Next.js Link for cross-zone navigation
❌ Share complex state between zones
❌ Ignore zone-specific performance optimization
❌ Deploy zones with inconsistent naming
❌ Skip testing cross-zone functionality
❌ Use hard-coded URLs for zone references
❌ Neglect SEO for content zones
❌ Mix authentication systems between zones

## Troubleshooting

### Common Issues

#### Navigation Problems
- **Issue**: Links between zones not working
- **Solution**: Use anchor tags instead of Next.js Link for cross-zone navigation

#### Authentication Issues
- **Issue**: User not authenticated in secondary zones
- **Solution**: Configure cookie domain to work across zones

#### Asset Loading Problems
- **Issue**: Assets not loading in zones
- **Solution**: Configure assetPrefix correctly for each zone

#### Performance Issues
- **Issue**: Slow loading between zones
- **Solution**: Implement proper prefetching and caching strategies

#### SEO Problems
- **Issue**: Poor SEO for zone content
- **Solution**: Configure proper meta tags and sitemaps for each zone

### Debug Tools
- Use browser dev tools to inspect network requests between zones
- Monitor Vercel function logs for each zone
- Use analytics to track user journeys across zones
- Implement custom logging for cross-zone events
