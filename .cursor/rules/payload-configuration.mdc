---
description:
globs:
alwaysApply: false
---
# Payload CMS Configuration Patterns

## Overview

Shipkit conditionally initializes Payload CMS based on environment variables. The **[src/payload.config.ts](mdc:src/payload.config.ts)** file handles graceful degradation when no database is configured.

## Conditional Initialization

### Database Requirement Check

Payload CMS only initializes when a database is available:

```typescript
const isPayloadEnabled = !!process.env.DATABASE_URL && !!process.env.PAYLOAD_SECRET && !envIsTrue("DISABLE_PAYLOAD");
```

### Plugin Array Pattern

Plugins are conditionally added using array spread patterns:

```typescript
plugins: [
  payloadCloudPlugin(),

  // S3 Storage - conditional
  ...(process.env.NEXT_PUBLIC_FEATURE_S3_ENABLED === "true" && isPayloadEnabled
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.AWS_BUCKET_NAME!,
          config: {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
            region: process.env.AWS_REGION!,
          },
        }),
      ]
    : []),

  // Vercel Blob Storage - conditional
  ...(process.env.NEXT_PUBLIC_FEATURE_VERCEL_BLOB_ENABLED === "true" && isPayloadEnabled
    ? [
        vercelBlobStorage({
          collections: { media: true },
          token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN!,
        }),
      ]
    : []),

],
// Email adapter - conditional (outside plugins array)
...(buildTimeFeatureFlags.NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED
  ? {
      email: resendAdapter({
        defaultFromAddress: RESEND_FROM_EMAIL,
        defaultFromName: emailFromName,
        apiKey: process.env.RESEND_API_KEY || "",
      }),
    }
  : {}),
],
```

## Database Configuration

### Conditional Database Adapter

The database adapter is only added when Payload is enabled:

```typescript
if (isPayloadEnabled) {
  config.db = postgresAdapter({
    schemaName: dbSchemaName,
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    beforeSchemaInit: [
      ({ schema, adapter }) => {
        // Define relationships between Payload and application tables
        return {
          ...schema,
          tables: {
            ...schema.tables,
            // Enhanced relationships
            users: {
              ...schema.tables.users,
              relationships: [
                {
                  relationTo: "public.shipkit_user",
                  type: "oneToOne",
                  onDelete: "CASCADE",
                },
              ],
            },
            // Additional table relationships...
          },
        };
      },
    ],
    migrationDir: path.resolve(dirname, "migrations"),
  });
}
```

## Environment Variables

### Required for Payload

- `DATABASE_URL` - PostgreSQL connection string
- `PAYLOAD_SECRET` - Secret key for Payload CMS
- `DISABLE_PAYLOAD` - Set to "true" to disable Payload (optional)

### Optional Features

- `AWS_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` - For S3 storage
- `VERCEL_BLOB_READ_WRITE_TOKEN` - For Vercel Blob storage
- `RESEND_API_KEY` - For Resend email adapter

### Build-time Feature Flags

Feature flags from **[src/config/features-config.ts](mdc:src/config/features-config.ts)**:

- `NEXT_PUBLIC_FEATURE_S3_ENABLED`
- `NEXT_PUBLIC_FEATURE_VERCEL_BLOB_ENABLED`
- `NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED`

## Auto-Seeding Pattern

### Conditional Seeding

Only seed when Payload is enabled and database exists:

```typescript
async onInit(payload: any) {
  try {
    if (!isPayloadEnabled) {
      console.info("⏭️ Payload CMS is disabled, skipping seeding");
      return;
    }

    if (process.env.PAYLOAD_AUTO_SEED === "false") {
      console.info("⏭️ Automatic Payload CMS seeding is disabled");
      return;
    }

    const shouldSeed = await checkIfSeedingNeeded(payload);

    if (shouldSeed || process.env.PAYLOAD_SEED_FORCE === "true") {
      console.info("🌱 Seeding Payload CMS with initial data...");

      const { seedAllDirect } = await import("./lib/payload/seed-utils");
      await seedAllDirect(payload);

      await markSeedingCompleted(payload);
      console.info("✅ Seeding completed and flag set");
    }
  } catch (error) {
    console.error("❌ Error in Payload CMS onInit hook:", error);
  }
},
```

### Seeding Status Management

Track seeding completion to avoid duplicate seeding:

```typescript
async function checkIfSeedingNeeded(payload: any): Promise<boolean> {
  try {
    const settings = await payload.findGlobal({
      slug: "settings",
    });

    if (settings?.seedCompleted) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking if seeding is needed:", error);
    return true;
  }
}

async function markSeedingCompleted(payload: any): Promise<void> {
  try {
    await payload.updateGlobal({
      slug: "settings",
      data: {
        seedCompleted: true,
        seedCompletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error marking seeding as completed:", error);
  }
}
```

## Collections and Globals

### Schema Integration

Payload collections integrate with application database schema:

```typescript
// Users collection integrates with shipkit_user table
users: {
  relationships: [
    {
      relationTo: "public.shipkit_user",
      type: "oneToOne",
      onDelete: "CASCADE",
    },
  ],
},

// RBAC collection integrates with role/permission tables
rbac: {
  relationships: [
    {
      relationTo: "public.shipkit_role",
      type: "oneToMany",
    },
    {
      relationTo: "public.shipkit_permission",
      type: "oneToMany",
    },
  ],
},
```

## Common Patterns

### Array Spread for Conditional Plugins

ALWAYS use array spread for conditional plugins:

```typescript
// ✅ Correct - Array spread for plugins
...(condition ? [plugin()] : [])

// ❌ Wrong - Object spread (causes "not iterable" error)
...(condition ? plugin() : {})
```

### Object Spread for Configuration Fields

Use object spread for configuration fields like email adapters:

```typescript
// ✅ Correct - Object spread for config fields
...(condition ? { email: emailAdapter() } : {})

// ❌ Wrong - Array spread for config fields
...(condition ? [{ email: emailAdapter() }] : [])
```

### Feature Flag Integration

Check both environment variables and build-time feature flags:

```typescript
const isFeatureEnabled =
  process.env.FEATURE_ENV_VAR === "true" &&
  buildTimeFeatureFlags.NEXT_PUBLIC_FEATURE_FLAG_ENABLED &&
  isPayloadEnabled;
```

### Error Boundaries

Wrap Payload initialization in try-catch blocks:

```typescript
try {
  // Payload initialization
} catch (error) {
  console.error("Payload initialization error:", error);
  // Continue without Payload
}
```

## Debugging

### Check Payload Status

```typescript
console.log("Payload enabled:", isPayloadEnabled);
console.log("Database URL set:", !!process.env.DATABASE_URL);
console.log("Payload secret set:", !!process.env.PAYLOAD_SECRET);
console.log("Disable flag:", process.env.DISABLE_PAYLOAD);
```

### Plugin Loading

```typescript
console.log("Active plugins:", config.plugins?.length || 0);
console.log("S3 enabled:", process.env.NEXT_PUBLIC_FEATURE_S3_ENABLED === "true");
console.log("Blob enabled:", process.env.NEXT_PUBLIC_FEATURE_VERCEL_BLOB_ENABLED === "true");
```

## Migration Strategy

When transitioning from local storage to Payload:

1. Set `DATABASE_URL` environment variable
2. Set `PAYLOAD_SECRET` to a secure value
3. Run database migrations
4. Enable Payload features incrementally
5. Import existing local storage data if needed
