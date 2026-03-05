---
title: "Rebranding Guide"
description: "A comprehensive guide for customizing and rebranding your Shipkit application, including logos, colors, fonts, and content updates."
---

# Rebranding Guide

This guide explains how to rebrand the Shipkit boilerplate to your own project name and branding.

## Automated Rebranding

The easiest way to rebrand is to use the automated rebranding script:

```bash
bunx tsx scripts/rebrand.ts
```

This script will prompt you for essential branding information and update the necessary files automatically.

### Dry Run Mode

If you want to preview the changes without actually modifying any files, use the `--dry-run` flag:

```bash
bunx tsx scripts/rebrand.ts --dry-run
```

This will show you what changes would be made without actually writing to any files.

### Command Line Arguments

You can also provide the branding information as command line arguments:

```bash
bunx tsx scripts/rebrand.ts --name "MyApp" --domain "myapp.com" --creator-name "John Doe"
```

Available arguments:

- `--name`: Project name (e.g., "MyApp")
- `--slug`: Project slug, lowercase and hyphenated (e.g., "my-app")
- `--domain`: Domain without protocol (e.g., "myapp.com")
- `--creator-name`: Your name (optional)

The script will automatically derive sensible defaults for other values based on these inputs.

## Manual Rebranding

If you prefer to rebrand manually, you can update the following files:

1. `src/config/site-config.ts`: This is the main configuration file that contains most of the branding information.
2. `.env.example`: Update the database name.
3. `package.json`: Update the project name.

### Site Configuration

The `src/config/site-config.ts` file contains a `branding` section that centralizes most of the branding information:

```typescript
branding: {
    projectName: "Shipkit", // Change this to your project name
    projectSlug: "shipkit", // Change this to your project slug
    productNames: {
        bones: "Bones", // Product tiers
        brains: "Brains",
        main: "Shipkit",
    },
    domain: "shipkit.io", // Change this to your domain
    protocol: "web+shipkit", // Change this to your protocol
    githubOrg: "shipkit-io", // Change this to your GitHub organization
    githubRepo: "bones", // Change this to your GitHub repository
    vercelProjectName: "bones-app", // Change this to your Vercel project name
    databaseName: "shipkit", // Change this to your database name
},
```

You should also update the following sections:

- `name`: The project name
- `url`: The project URL
- `ogImage`: The Open Graph image URL
- `email`: Email addresses
- `creator`: Creator information
- `repo`: Repository information
- `metadata.keywords`: Keywords for SEO

## After Rebranding

After rebranding, you should:

1. Update your `.env` file with the new database name
2. Restart your development server
3. Check that all branding references have been updated correctly

## Troubleshooting

If you encounter any issues during rebranding:

1. Check the `src/config/site-config.ts` file to ensure all branding information has been updated correctly
2. Look for any hardcoded references to "Shipkit" or "bones" in the codebase
3. Update any references that weren't caught by the rebranding script

If you find any hardcoded references that weren't updated by the rebranding script, please consider contributing to improve the script.
