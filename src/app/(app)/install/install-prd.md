# Shipkit Installation Workflow - Product Requirements Document

## Overview

The Shipkit installation workflow provides a browser-based mechanism for installing and configuring shadcn/ui components. This document outlines the technical requirements, implementation details, and expected behavior of the installation process.

## Goals

1. Provide a seamless installation experience for shadcn/ui components
2. Allow users to preview and customize components before installation
3. Support multiple project structures (app directory, src/app directory)
4. Ensure compatibility with various development environments
5. Implement efficient caching to minimize redundant operations
6. Produce clean, production-ready code without unnecessary files
7. Use repository source code directly without needing template duplicates

## Technical Architecture

### Components

1. **WebContainer**
   - Provides a browser-based containerized environment for installing components
   - Manages file operations and command execution without server-side processing
   - Simulates a Node.js environment for running shadcn/ui installation commands
   - Accesses repository source code directly without duplication

2. **File Processing System**
   - Uses component files directly from repository source code
   - Processes file content and adapts paths based on project structure
   - Filters unnecessary files (lock files, .DS_Store, etc.)

3. **Caching Layer**
   - Implements multi-level caching for directories, file content, and processed results
   - Prevents redundant API calls and filesystem operations
   - Optimizes performance for repeated operations

4. **UI Components**
   - Provides interface for selecting components to install
   - Displays file previews and changes before installation
   - Offers configuration options for customization

### Implementation Details

#### WebContainer Initialization

1. Boot the WebContainer in a cross-origin isolated environment
2. Mount initial filesystem with basic project structure
3. Access shadcn/ui components directly from repository source code
4. Create required directory structure for component processing

#### Template Processing

1. Access component files directly from repository source code
2. Transform file paths to match project structure
3. Filter out unnecessary files (.DS_Store, lock files, etc.)
4. Cache processed files for efficient reuse

#### Component Installation

1. Execute installation command in WebContainer
2. Capture changes to filesystem
3. Present changed files to user for review
4. Support file download or PR creation

## Performance Requirements

1. Initial container boot should complete within 5 seconds
2. Subsequent component installations should be nearly instantaneous
3. Minimize network requests and API calls
4. Implement caching at all levels of the process
5. Avoid redundant operations when processing the same files
6. Eliminate unnecessary template duplication to reduce repository size

## Filtering Requirements

The following file types should be filtered out of the installation process:

1. **System Files**
   - `.DS_Store` and similar OS-specific files
   - Hidden files not relevant to the component

2. **Lock Files**
   - `package-lock.json`
   - `yarn.lock`
   - `pnpm-lock.yaml`
   - `bun.lockb`
   - `bun.lock`
   - Other package manager lock files

3. **Configuration Files** (when specified by the user)
   - `README.md`
   - `eslint.config.js/mjs`
   - `next.config.js/ts`
   - `postcss.config.js/mjs`
   - `tsconfig.json`

4. **Environment Files**
   - `.env`
   - `.env.local`
   - `.env.development`
   - `.env.production`

## Error Handling

1. Provide clear error messages for common failure scenarios
2. Gracefully handle cross-origin isolation requirements
3. Recover from network interruptions when possible
4. Provide fallback options when WebContainer fails

## Testing Requirements

1. Test with various project structures
2. Verify compatibility with different component combinations
3. Ensure proper handling of edge cases (empty paths, missing files)
4. Validate performance with large component sets

## Future Enhancements

1. Improved component visualization before installation
2. Custom theme configuration
3. Offline support for installation
4. Integration with version control systems for seamless PR creation
5. Implement a complete in-memory filesystem to eliminate duplicate requests

## Known Limitations

1. Requires cross-origin isolation for WebContainer functionality
2. Browser support is limited to browsers that support SharedArrayBuffer
3. May have performance issues with very large component sets
4. Initialization can be slow on lower-end devices

## Technical Debt Considerations

1. Refactor to eliminate duplicate directory traversals
2. Improve error reporting and logging
3. Enhance caching mechanisms for better performance
4. Standardize API responses and error formats
5. Implement stronger typing for all functions and data structures
6. Remove all copies of template files from public directory

## Source Code Access

The installation process should:

1. Access shadcn/ui component files directly from repository source code
2. Eliminate the need for duplicate template files in public/templates directory
3. Use the repository's component structure as the source of truth
4. Maintain path transformation and filtering capabilities when using source files
5. Support proper versioning through repository tags/branches

## WebContainer Optimization Requirements

### Selective File Loading

1. **Essential Configuration Files**
   - Only load necessary configuration files:
     - package.json
     - tsconfig.json
     - components.json
     - tailwind.config.js/ts
     - postcss.config.js
     - next.config.js/ts (if needed)

2. **Targeted Directory Structure**
   - Mount only directories that shadcn/ui might modify:
     - /components (including /ui subdirectory)
     - /app (for page components)
     - /src (if using src directory structure)
     - /lib (for utility functions)
     - /hooks (for custom hooks)
     - /styles (for global styles)

3. **Minimal Initial Structure**
   - Create empty directories where shadcn might add new files
   - Initialize directories with bare minimum files to represent structure
   - Avoid loading unrelated project files that won't be affected by component installation

4. **Dynamic File Handling**
   - Load additional files only when needed for specific components
   - Implement on-demand loading for component dependencies
   - Cache previously loaded files to avoid redundant operations

5. **Installation Analysis**
   - Before installation, analyze component dependencies to determine required files
   - Prepare targeted filesystem based on installation requirements
   - Only mount necessary source directories for the specified component
