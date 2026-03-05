---
title: "Feature Flags"
description: "Learn how to implement and use feature flags in Shipkit to enable/disable features dynamically and manage feature rollouts effectively."
---

# Feature Flags

Shipkit uses a simple, clean feature flag system based on environment variables.

## How It Works

The `src/config/features-config.ts` file detects which features are enabled based on your environment variables and generates build-time flags:

- **Build-time flags** - Only enabled features are injected into the client bundle as `NEXT_PUBLIC_FEATURE_*` with string value "true"
- **Disabled features** - Are not included in the environment at all (undefined)

This allows natural boolean checks: `if (env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) { ... }`

## Usage

### Client-side

```typescript
import { env } from "@/env";

if (env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
  // Stripe logic - only runs when feature is actually enabled
}
```

### Build-time (Next.js config)

```typescript
import { buildTimeFeatures } from "@/config/features-config";

if (buildTimeFeatures.PAYLOAD_ENABLED) {
  // Configure payload at build time
}
```

## Feature Detection Rules

Features are automatically enabled when their required environment variables are present:

- **Database**: `DATABASE_URL`
- **Payload CMS**: `DATABASE_URL` + `PAYLOAD_SECRET` (and not `DISABLE_PAYLOAD=true`)
- **Stripe**: `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Auth providers**: Provider ID + secret (e.g., `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET`)
- **Services**: API key (e.g., `OPENAI_API_KEY`)

## Enable/Disable Flags

Some features can be explicitly controlled:

- `DISABLE_PAYLOAD=true` - Disable Payload CMS (by default Payload is enabled when `DATABASE_URL` and `PAYLOAD_SECRET` are set)
- `BETTER_AUTH_ENABLED=true` - Enable Better Auth
- `DISABLE_MDX=true` - Disable MDX support
- `DISABLE_PWA=true` - Disable PWA
- `ENABLE_DEVTOOLS=true` - Enable DevTools (exposes `NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED=true`)

## Adding New Features

1. Add detection logic to the `features` object in `features-config.ts`:

   ```typescript
   const features = {
     // Single variable check
     myFeature: () => EnvChecker.has("MY_API_KEY"),

     // Multiple variable check
     myAuthProvider: () => EnvChecker.has("MY_CLIENT_ID", "MY_CLIENT_SECRET"),
   };
   ```

2. The build and server flags will be generated automatically
3. Add corresponding env vars to `env.ts` for type safety

## EnvChecker Utility Methods

- `EnvChecker.has(...names)` - Check if all variables exist (supports single or multiple)
- `EnvChecker.hasAny(...names)` - Check if any variable exists
- `EnvChecker.isEnabled(name)` - Check if variable is enabled (`true/1/yes/on`)

## Benefits

- **Clean**: Simple object-based configuration
- **Type-safe**: Integrated with T3 Env validation
- **Flexible**: Supports `true/1/yes/on` and `false/0/no/off` values
- **Automatic**: Flags generated based on available environment variables
- **Consistent**: Single `has()` method for all variable checks
