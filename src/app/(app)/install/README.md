# Shipkit Installation Module

This module handles the WebContainer installation for shadcn/ui components in Shipkit.

## Recent Improvements

### 1. Command Execution Enhancement

- Added automatic `-y` flag for NPX commands to avoid manual interaction
- Implemented interactive prompt handling with auto-responding capabilities
- Added proper timeout handling for commands
- Created comprehensive logging mechanisms with timestamp tracking

### 2. Enhanced Caching System

- Added multi-level caching for file content, directory listings, and processed templates
- Implemented normalized path handling for consistent cache key generation
- Cached processed templates by project structure to avoid redundant processing
- Added proper cache invalidation where necessary

### 3. Improved Race Condition Handling

- Implemented explicit tracking of container initialization state
- Added wait logic for concurrent initialization attempts
- Implemented proper cleanup in both success and error cases
- Added timeout detection and handling for long-running operations

### 4. Robust File Filtering

- Added comprehensive file filtering for system files, lock files, and env files
- Implemented normalized path handling for consistency
- Added proper binary file type detection and handling
- Improved content-type handling for various file types

### 5. Better Error Handling

- Added specific error messages for common failure scenarios
- Implemented proper error recovery for non-critical failures
- Added logging for all error cases with clear contextualization
- Improved error propagation while maintaining system stability

### 6. UI Improvements

- Modern two-panel layout for file changes display
- File badges to distinguish new vs. modified files
- Copy-to-clipboard functionality for code snippets
- Improved code display with syntax highlighting

### 7. Component Organization

- Components moved to `_components` directory following naming convention
- Underscore prefix indicates internal/private components
- Improved component structure for better organization
- Clear separation of concerns between components

### 8. Direct Source Component Access

- Now using repository source components directly
- Eliminated duplicate template files in public/templates
- Reduced repository size by removing duplicated assets
- Using single source of truth for component files
- Modified APIs to serve source components

## Architecture

The install system is built around several key components:

1. **Container Manager**: Central service for managing the WebContainer instance.
2. **Command and Process Manager**: Handles command execution within the container.
3. **Filesystem Utilities**: Provides file system operations for the container.
4. **Shared Utilities**: Common utilities for template operations used by both client and server components.
5. **Client Utilities**: Client-specific utility functions that interact with the browser environment.
6. **Logging System**: Standardized logging across the installation process.

## Usage

```typescript
import { ContainerManager } from './container-manager';

// Initialize the container
const containerManager = new ContainerManager();
await containerManager.initialize();

// Run a shadcn command
const changedFiles = await containerManager.runShadcnCommand(['add', 'button']);

// Process the changed files
console.log(`Added ${changedFiles.length} files`);
```

## Key Files

- `api/utils.ts`: Re-exports server-safe utilities for API routes.
- `filesystem-utils.ts`: Provides file system operations for the container.
- `command-utils.ts`: Manages command execution within the container.
- `container-manager.ts`: Manages the WebContainer lifecycle.
- `logging.ts`: Provides a standardized logging interface.
- `shared-utils.ts`: Contains shared utilities for both client and server components.
- `client-utils.ts`: Contains client-side utilities that interact with browser APIs.
- `types.ts`: Type definitions used throughout the installation system.
- `_components/` - UI components specific to the installation module
