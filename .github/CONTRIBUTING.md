# Contributing to Shipkit Bones

Thanks for your interest. **Shipkit Bones** is the free, source-available (FSL-1.1-MIT) Next.js boilerplate that the rest of the Shipkit ecosystem builds on. It's a Next.js 16 + React 19 (App Router + TypeScript) starter with Tailwind and Shadcn/UI, plus auth wired in (NextAuth + Better Auth). The full stack — database, payments, CMS, AI integrations, premium components — lives in the paid [Shipkit](https://shipkit.io) framework downstream of this repo.

## Quick start

Prerequisites: **Bun**, **PostgreSQL** (or a hosted Postgres URL), Node 20+.

```bash
git clone https://github.com/shipkit-io/bones.git
cd bones
bun install
cp .env.example .env       # only DATABASE_URL is required to boot

bun dev                    # Next dev server with Turbo
bun run db:migrate         # apply migrations once .env is set
```

See [`CLAUDE.md`](../CLAUDE.md) for the architecture deep-dive: route groups, services / actions split, feature-flag system, Payload integration.

## Reporting bugs

Open an issue using the **Bug Report** template. Include the URL or page, exact reproduction steps, what you expected, what you saw, and (if relevant) which feature flags were enabled. Browser/OS only when the bug is visual or device-specific.

## Proposing changes

For non-trivial work — new routes, schema changes, auth/permission changes, new integrations — open an issue first to align on the approach. Small fixes (typos, dead links, single-file bugs) can go straight to a PR.

Because Bones is the upstream for `shipkit` and several downstream sites, changes here ripple. Be conservative about renames and breaking refactors; flag them in the PR description.

## Pull requests

1. Branch from `main`. Use a descriptive name (`fix/auth-redirect`, `feat/builder-page`).
2. One logical change per PR. Don't bundle refactors with feature work.
3. Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`).
4. Fill in the PR template — especially the test plan.

## Code style

- **Server Components first.** Reach for `'use client'` only when you need browser-only APIs or interactivity.
- **Server Actions for mutations**, Server Components for data fetching. Never use server actions to fetch.
- **Services layer.** Business logic lives in `src/server/services/`; mutation actions in `src/server/actions/` call services. **Server Components call services directly for data fetching.** **Client Components call actions for mutations** — never reach into services from the client.
- **Drizzle + Postgres.** Schema in `src/server/db/schema.ts`. After edits: `bun run db:generate` → `bun run db:migrate`. Prefer timestamps over booleans (`activeAt`, not `isActive`).
- **TypeScript.** Strict; no `any` without an explanatory comment. Interfaces over types; no enums (use objects/maps).
- **Naming.** kebab-case files, PascalCase components, camelCase variables. Named exports only — no default exports.
- **File size.** Keep files under 500 lines.
- **Feature flags.** Toggle features via `NEXT_PUBLIC_FEATURE_*_ENABLED` env vars. Features must degrade cleanly when disabled.

Run before pushing:

```bash
bun run lint:fix       # Biome + ESLint + Prettier auto-fix
bun run typecheck      # tsc --noEmit
bun test               # Vitest
```

## Downstream impact

Bones is the upstream for [`shipkit`](https://github.com/lacymorrow/shipkit) and several deployed sites. Downstream repos track their bones version via the `shipkit.bones` key in `package.json` and sync via `scripts/git-sync-upstream.ts`. When making changes here, consider whether downstream consumers will need migration notes — call those out in the PR description.

## Security

Please **do not open public issues for security vulnerabilities**. See [SECURITY.md](SECURITY.md) for private disclosure.

## License

Bones is licensed under [FSL-1.1-MIT](../LICENSE) — the Functional Source License with an MIT future grant. By contributing, you agree that your contributions will be licensed under the same terms. FSL is source-available: free to use, modify, and create derivative works for any Permitted Purpose (internal use, education, research, professional services). It excludes Competing Use, then converts to standard MIT two years after each release. If you want commercial support or the premium downstream framework, see [Shipkit](https://shipkit.io).
