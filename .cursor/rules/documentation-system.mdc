---
description:
globs:
alwaysApply: false
---
# Documentation System

## Overview
The Shipkit documentation system uses dynamic file-based loading from the `/docs` directory at the project root. It supports both `.mdx` and `.md` files with full production-ready security features.

## Architecture

### Core Components
- **Main Library**: [src/lib/docs.ts](mdc:src/lib/docs.ts) - Core documentation loading and processing
- **Search Service**: [src/server/services/docs-search.ts](mdc:src/server/services/docs-search.ts) - Documentation search functionality
- **Pages**: [src/app/(app)/docs/[[...slug]]/page.tsx](mdc:src/app/(app)/docs/[[...slug]]/page.tsx) - Dynamic routing for docs

### File Structure
```
/docs/                          # Root documentation directory
├── index.mdx                   # Main documentation index
├── *.mdx, *.md                # Root level docs
├── content-management/         # Organized by topic
│   ├── index.mdx              # Section index
│   └── *.mdx, *.md            # Section documentation
├── development/
├── integrations/
└── snippets/
```

## Security Features (Production-Ready)

### Input Validation & Sanitization
- **Path Traversal Protection**: All file paths validated using `path.resolve()`
- **Slug Validation**: Regex patterns prevent malicious input
- **Content Sanitization**: HTML sanitization prevents XSS attacks
- **Size Limits**: Files limited to 5MB, content to 1MB

### Rate Limiting & DoS Prevention
- Maximum 100 documents total
- Maximum 20 directories per level
- Maximum 50 files per directory
- Maximum depth of 5 levels
- Input length limits enforced via Zod schemas

### Error Handling
- Comprehensive error logging without information leakage
- Graceful degradation on missing files
- Proper HTTP status codes
- No stack trace exposure in production

## File Format Support

### MDX Files (.mdx)
- Full React component support
- Frontmatter metadata required
- Dynamic imports supported
- Processing via remark/rehype

### Markdown Files (.md)
- Standard markdown syntax
- Frontmatter metadata required
- Converted to React components
- Syntax highlighting support

### Required Frontmatter
```yaml
---
title: "Document Title" # Required, max 500 chars
description: "Optional description" # Optional, max 1000 chars
section: "category-name" # Optional, defaults to "core", max 100 chars
updatedAt: "2024-01-01" # Optional
author: "Author Name" # Optional, max 200 chars
keywords: ["tag1", "tag2"] # Optional array, each max 100 chars
---
```

## Core Functions

### `getDocBySlug(slug: string)`
- Loads documents from `/docs` directory
- Handles both `.mdx` and `.md` files
- Returns sanitized Doc object or null
- Cached for performance

### `getAllDocs()`
- Discovers all documents recursively
- Returns array of Doc objects
- Limited to prevent DoS attacks
- Sorted and filtered

### `importDocFromRootDocs(slug: string)`
- Dynamic import from filesystem
- Security validation on all paths
- Handles missing files gracefully
- Supports index files

## Navigation Generation

### Automatic Structure
- Navigation generated from filesystem structure
- Directory names become section titles
- File frontmatter provides titles and metadata
- Automatic sorting and organization

### processDirectory()
- Recursively processes directories
- Validates all file paths for security
- Generates NavSection arrays
- Limits depth and file counts

## Development Guidelines

### Adding New Documentation
1. Create `.mdx` or `.md` file in appropriate `/docs` subdirectory
2. Include required frontmatter with title and description
3. Use semantic file naming (kebab-case)
4. Organize into logical directory structure

### Security Considerations
- Never bypass path validation functions
- Always use `sanitizeFilePath()` for user input
- Validate frontmatter data types
- Monitor file sizes and counts
- Log suspicious access patterns

### Performance Best Practices
- Use caching for frequently accessed docs
- Limit recursive directory depth
- Implement pagination for large doc sets
- Monitor memory usage with large files

## Webpack Configuration

### Bundle Inclusion
- [next.config.ts](mdc:next.config.ts) includes `/docs` directory in webpack bundle
- Raw loader configured for `.md` and `.mdx` files
- File watching enabled for hot reload
- Output file tracing includes `./docs/**/*`

### Build Process
```typescript
// In next.config.ts
webpack: (config) => {
  config.module.rules.push({
    test: /\.(md|mdx)$/,
    use: 'raw-loader',
    include: [
      path.join(__dirname, 'docs'),
      path.join(__dirname, 'src/content')
    ]
  });
  return config;
}
```

## API Endpoints

### Search API
- [src/app/api/docs/search/route.ts](mdc:src/app/api/docs/search/route.ts) - Full-text search
- Implements rate limiting and input validation
- Returns structured search results
- Supports relevance scoring

## Error Scenarios & Handling

### Common Issues
- **Missing Files**: Returns null, logs warning
- **Invalid Frontmatter**: Skips file, logs error
- **Path Traversal Attempts**: Blocks request, logs security event
- **Large Files**: Rejects with size limit error
- **Deep Nesting**: Stops at max depth limit

### Monitoring & Logging
- Security events logged at WARN level
- Performance issues logged at INFO level
- Errors include context but not sensitive data
- Regular audit of access patterns recommended

## Migration Notes

### From Legacy Location
- All docs moved from `/src/content/docs` to `/docs`
- Legacy import code removed to prevent module resolution errors
- Search service updated to only load from root directory
- Backward compatibility maintained via fallback logic

### Breaking Changes
- Dynamic imports from `@/content/docs/` no longer supported
- All documentation must be in `/docs` directory
- Frontmatter structure enforced via flexible Zod validation
- Only `title` field is required in frontmatter
- `description` is now optional
- `section` is flexible string (no longer restricted enum)

## Testing

### Validation Tests
- Path traversal protection
- Input sanitization
- File size limits
- Directory depth limits
- Frontmatter validation

### Performance Tests
- Large file handling
- Deep directory structures
- High-frequency access patterns
- Memory usage monitoring

## Dependencies

### Required Packages
- `remark` - Markdown processing
- `remark-gfm` - GitHub Flavored Markdown
- `remark-html` - HTML output
- `rehype-highlight` - Syntax highlighting
- `gray-matter` - Frontmatter parsing
- `raw-loader` - Webpack raw file loading
- `zod` - Schema validation

### Version Compatibility
- Next.js 14+ (App Router)
- React 18+
- Node.js 18+

## Production Deployment

### Environment Variables
- No special environment variables required
- Uses filesystem access (ensure `/docs` directory is included in deployment)
- Consider CDN for static assets

### Performance Monitoring
- Monitor doc loading times
- Track search query performance
- Alert on high error rates
- Monitor file system access patterns

### Security Checklist
- [ ] Path validation functions working
- [ ] Input sanitization enabled
- [ ] File size limits enforced
- [ ] Rate limiting active
- [ ] Error logging configured
- [ ] No sensitive data in logs
- [ ] Access patterns monitored

This documentation system is fully production-ready with comprehensive security, performance, and maintainability features.
