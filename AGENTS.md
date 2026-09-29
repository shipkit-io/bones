# AGENTS.md

Instructions for coding agents working in this repository. Read this first. `CLAUDE.md` has the commands and architecture, and imports this file.

## What this repo is

- **Bones** (`shipkit-io/bones`) is the root template and the upstream of every ShipKit project. It ships the foundation: Next.js 16 App Router, TypeScript, Tailwind, shadcn/ui, Drizzle ORM, Auth.js v5 (Better Auth is the chosen default and the switch is in progress), Resend, analytics providers, and env-driven feature flags.
- **ShipKit** (`lacymorrow/shipkit`) is the everything-included build downstream of Bones. It proves the integrations work together and is where the shadcn registry is built from.
- **Integrations are registry items.** Payments, CMS, AI, storage and the rest are added one at a time with `npx shadcn add @shipkit/<item>` after adding `"@shipkit": "https://shipkit.io/r/{name}.json"` to `components.json` under `registries`. Catalog: https://shipkit.io/docs/features/registry
- Package manager: **pnpm** here (`packageManager` in `package.json`). ShipKit uses bun. Always use the one the project declares.

## Built-in features: do not reimplement

Features turn on when their env vars exist. Detection lives in `src/config/features-config.ts`. Never set `NEXT_PUBLIC_FEATURE_*` by hand; the build derives those. Before writing code for any of these, read its guide:

| Feature   | Guide                       | Enable with                                   |
| --------- | --------------------------- | --------------------------------------------- |
| Auth      | `public/llms/auth.txt`      | `APP_SECRET` plus `AUTH_<PROVIDER>_ID/SECRET` |
| Database  | `public/llms/database.txt`  | `DATABASE_URL`                                |
| Email     | `public/llms/email.txt`     | `RESEND_API_KEY`                              |
| Analytics | `public/llms/analytics.txt` | `NEXT_PUBLIC_POSTHOG_KEY` and others          |
| Payments  | `public/llms/payments.txt`  | registry item, then `STRIPE_SECRET_KEY` etc.  |
| CMS       | `public/llms/cms.txt`       | registry item, then `PAYLOAD_SECRET`          |
| Storage   | `public/llms/storage.txt`   | registry item, then S3 or Vercel Blob keys    |
| AI        | `public/llms/ai.txt`        | registry item, then `OPENAI_API_KEY` etc.     |
| Waitlist  | `public/llms/waitlist.txt`  | registry item, needs `DATABASE_URL`           |
| Registry  | `public/llms/registry.txt`  | `npx shadcn add @shipkit/<item>`              |

`APP_SECRET` derives `AUTH_SECRET`, `BETTER_AUTH_SECRET` and `PAYLOAD_SECRET`. Set one secret.

## Conventions

- Server Components first. Add `'use client'` only when strictly necessary.
- Server Actions for mutations (`src/server/actions/`). Never fetch data with a server action; use a Server Component.
- Business logic in services (`src/server/services/`). Actions call services. Components call actions.
- Named exports only. kebab-case files, PascalCase components, camelCase variables. Files under 500 lines.
- Timestamps over booleans in schemas (`activeAt`, not `isActive`).
- Handle the disabled case of every feature flag gracefully.
- Preserve existing comments. Add comments only for "why".

## Do not

- Add dependencies by hand. `npx shadcn add` and the package manager own dependencies. Ask before adding anything else.
- Commit secrets. `.env.local` is gitignored and is the right place for placeholders during setup; never write real values into chat or logs.
- Modify CI workflows without approval.
- Prune code for integrations you are not using. Features degrade cleanly when unconfigured, and pruning breaks `shipkit sync`.
- Make changes beyond the assigned task.

## Proof of work

Run and report before calling anything done:

```bash
pnpm run typecheck
pnpm run lint        # pnpm run lint:fix first if needed
pnpm run test
pnpm run build       # for UI or config changes
```

Report as pass/fail with the failing output. A failing check means the task is not done.

## Upstream

This repo is the upstream. Downstream projects keep an `upstream` remote pointing here and run `shipkit sync` (or `pnpm run pull`) to merge changes on a PR branch. Do not rewrite history on `main`.

## Deployment

bones.sh deploys from this repo, branch `main`, via the Vercel project `bones`. See `CLAUDE.md`.
