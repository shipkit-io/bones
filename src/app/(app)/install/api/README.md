# Shipkit API Routes

This directory contains API routes for the Shipkit installation workflow. These routes provide file system access and template management for the WebContainer-based installation process.

## API Structure

### Core API Routes

1. `file/route.ts` - Retrieves file contents from the filesystem
   - Usage: `/install/api/file?path=path/to/file`
2. `template-files/route.ts` - Lists files in a directory

### Shared Utilities

The `utils.ts` file contains shared utilities and constants used across all API routes:

- File filtering logic via `shouldIgnoreFile()`
- Path sanitization via `sanitizePath()`
- Content type mapping via `getContentType()`
- Caching mechanisms for directory listings and file content
- Configuration constants

## Architecture Improvements

### Caching

- Directory listing cache to avoid redundant filesystem operations
- File content cache to minimize disk I/O
- Path normalization for consistent cache keys

### Security

- Path sanitization to prevent directory traversal attacks
- Explicit file filtering to control access
- Validation of file paths against project root

### Performance

- Filtering unwanted files before transmission
- Caching at multiple levels
- Optimized content type determination

## Configuration

Key configuration constants in `utils.ts`:

- `BINARY_EXTENSIONS`: List of binary file extensions
- `CONTENT_TYPE_MAP`: Mapping of file extensions to content types

## Usage

These API routes are consumed by the Shipkit installation WebContainer to:

1. Browse available files
2. Fetch file contents
3. Access project source code
