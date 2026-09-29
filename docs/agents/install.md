# Install ShipKit with a coding agent

This file is the spec a coding agent follows when a person pastes the install prompt. Humans can follow it too. It is the source of truth; the prompt on shipkit.io only points here.

## What you are building

- **Bones** (this repo, `shipkit-io/bones`) is the root template: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Drizzle ORM on Postgres, Better Auth (default) with Auth.js still available, Resend, analytics providers, and env-driven feature flags. Bones already contains every database table, every env key and every config seam ShipKit uses.
- **ShipKit integrations are shadcn registry items.** Payments, CMS, storage, AI and the rest are added one at a time with `npx shadcn add @shipkit/<item>`. Bones' `components.json` already registers `@shipkit`. Catalog: https://shipkit.io/r/registry.json (human page: https://shipkit.io/docs/features/registry).
- Bones ships a few **stub files** at integration seams (`src/payload.config.ts`, `src/lib/payload/payload.ts`, `src/server/services/s3.ts`, `src/lib/polar.ts`, `src/lib/lemonsqueezy/lemonsqueezy.ts`, `src/server/providers/{stripe,lemonsqueezy,polar}-provider.ts`). The matching item replaces them. That is the only overwrite an item performs.

## Prerequisites

- Node 22 (`.nvmrc`). Node 26 works for install since bones#98, but use 22.
- pnpm (`npm install -g pnpm`). Bones uses pnpm; ShipKit uses bun. Always use the manager in `package.json`'s `packageManager`.
- git. `gh` is optional (it creates the GitHub repo for you).
- A Postgres URL. Neon is the recommended host. The person supplies it; you never guess one.

## The interview: five questions, recommended answer first

Ask one at a time. Offer "defaults" up front, which is: Neon Postgres, Better Auth with GitHub and Google, MDX content, Resend, no payments yet. Free text is always allowed. Do not ask anything not listed here.

1. **Identity.** App name, slug (lowercase, hyphens), and the domain it will live on.
2. **Auth.** Better Auth (recommended) / Auth.js / Clerk / none. If Better Auth or Auth.js: which providers, multi-select, GitHub and Google preselected (Discord, GitLab, Bitbucket, Twitter available).
3. **Payments.** None yet (recommended) / Stripe / Lemon Squeezy / Polar.
4. **Content.** MDX only (recommended) / Payload CMS / Builder.io.
5. **Services.** Multi-select. Preselected: Neon Postgres, Resend email. Off by default: PostHog analytics, storage (S3), Upstash Redis caching, Cloudflare Turnstile, AI (OpenAI or Anthropic).

Anything else the person asks for that is not in ShipKit (i18n, the Vercel AI SDK, Stack Auth, Supabase Auth): say it is not in ShipKit and move on. Do not improvise it.

## Answers to items

| Answer        | Registry items                                     | Overwrites stubs?   |
| ------------- | -------------------------------------------------- | ------------------- |
| Better Auth   | none, it is in Bones                               | no                  |
| Auth.js       | `auth`                                             | no                  |
| Clerk         | not packaged yet; say so                           |                     |
| Stripe        | `payments`                                         | yes (`--overwrite`) |
| Lemon Squeezy | `payments`                                         | yes                 |
| Polar         | `payments`                                         | yes                 |
| Payload CMS   | `payload`, `cms-pages`                             | yes                 |
| Builder.io    | `builder-io`, `cms-pages`                          | no                  |
| PostHog       | `analytics`                                        | no                  |
| S3 storage    | `storage`                                          | yes                 |
| Upstash Redis | none, the kernel is in Bones; set the two env keys | no                  |
| Turnstile     | `turnstile`                                        | no                  |
| AI            | `ai`                                               | no                  |
| Resend email  | none, it is in Bones; set `RESEND_API_KEY`         | no                  |

`payments` ships all three providers; the one with keys turns on. Marketing and app blocks (`blog`, `docs`, `pricing`, `waitlist`, `dashboard`, `admin`, `settings`, `changelog`, `legal`, `faq`, `contact`, `feedback`) are optional extras; offer them only if the person asks what else exists.

## Show the plan, then run it

Print the exact commands and wait for a yes. Then run them in order. Never ask the person to paste a secret into the chat.

```bash
# 1. Create the project (creates the GitHub repo when gh is logged in, else clones)
npm create shipkit-app@latest <slug>
#    If create-shipkit-app is not on npm yet:
#    gh repo create <slug> --template shipkit-io/bones --clone --public && cd <slug>
#    git remote add upstream https://github.com/shipkit-io/bones.git
cd <slug>

# 2. Rebrand
pnpm dlx tsx scripts/rebrand.ts --name "<App Name>" --slug <slug> --domain <domain>

# 3. Add the chosen items (one command; --overwrite is added automatically for items
#    that replace a stub). `npx create-shipkit-app add <items>` does the same.
npx shadcn add @shipkit/<item> @shipkit/<item> -y [--overwrite]

# 4. Secrets that are generated, not typed
#    create-shipkit-app 0.4.1+ already wrote .env.local with a random APP_SECRET and
#    AUTH_STRATEGY=better-auth. Only if you used the gh template fallback:
echo "APP_SECRET=$(openssl rand -hex 32)" >> .env.local
echo "AUTH_STRATEGY=better-auth" >> .env.local        # or authjs
```

`shadcn add` appends every env key the items need to `.env.local` with empty values and never overwrites an existing key. After step 4, print the keys that are still empty, each with the URL where the value comes from:

| Key                                                                                | Where                                                                                                                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                                                     | https://console.neon.tech, Connection string                                                                                               |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`                                             | https://github.com/settings/developers, OAuth App, callback `<url>/api/better-auth/callback/github` (Auth.js: `/api/auth/callback/github`) |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`                                             | https://console.cloud.google.com/apis/credentials                                                                                          |
| `RESEND_API_KEY`                                                                   | https://resend.com/api-keys                                                                                                                |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | https://dashboard.stripe.com/apikeys and /webhooks                                                                                         |
| `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`     | https://app.lemonsqueezy.com/settings/api                                                                                                  |
| `POLAR_ACCESS_TOKEN`                                                               | https://polar.sh/settings                                                                                                                  |
| `PAYLOAD_SECRET`                                                                   | derived from `APP_SECRET`; leave empty                                                                                                     |
| `NEXT_PUBLIC_BUILDER_API_KEY`                                                      | https://builder.io/account/space                                                                                                           |
| `NEXT_PUBLIC_POSTHOG_KEY`                                                          | https://app.posthog.com/settings/project                                                                                                   |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`      | AWS IAM and S3 console                                                                                                                     |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                               | https://console.upstash.com                                                                                                                |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                           | https://dash.cloudflare.com, Turnstile                                                                                                     |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`                                            | provider console                                                                                                                           |

The person fills them in. A feature stays off until its keys exist; nothing breaks while a key is empty.

## Verify

```bash
pnpm install
pnpm typecheck
pnpm db:push            # once DATABASE_URL is set
pnpm dev
```

Then, in another shell: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/` must print 200, and with Better Auth `curl -s http://localhost:3000/api/better-auth/ok` must print `{"ok":true}`. Report the list of features that are on (read `NEXT_PUBLIC_FEATURE_*` from the dev server log, or run `pnpm dlx tsx -e 'import("./src/config/features-config").then(m => console.log(m.buildTimeFeatures))'`) next to the answers the person gave. Done means they match. A `shipkit doctor` command that prints this table is planned; until it exists, use the command above.

## Do not

- Do not set `NEXT_PUBLIC_FEATURE_*` by hand. The build derives them from the service keys. Turn a feature off with `DISABLE_<FEATURE>=true`.
- Do not add dependencies by hand. `shadcn add` and pnpm own them.
- Do not prune code for integrations that were not chosen. Features degrade cleanly, and pruning breaks `shipkit sync`.
- Do not pass `--overwrite` for items that do not replace a stub. If `shadcn add` asks to overwrite a file the table does not list, answer no and report it.
- Do not use Node 26, Next.js 15 idioms, the Pages Router, `npx create-shipkit` (that npm name is not ours), or `bun` in a Bones project.
- Do not write real secrets anywhere but `.env.local`, and never print one back.
- Do not touch files outside `.env.local`, `package.json`'s `shipkit` block, and what the CLI or shadcn created.

## Keeping up with upstream

Bones is the `upstream` remote. `pnpm run pull` (or `npx create-shipkit-app sync`) opens a PR with upstream changes. Because integrations are env-driven and the schema lives in Bones, syncs do not fight the person's choices.
