# Setup Requirements

Everything you need to get a Shipkit downstream project fully operational.

## GitHub Apps

### wei/pull — Upstream Sync

Automatically opens PRs when the upstream Shipkit repo is updated.

- **Install:** <https://github.com/apps/pull>
- **Grant access** to your fork/downstream repo
- Config is already included at `.github/pull.yml` — no additional setup needed
- [Documentation](https://github.com/wei/pull)

## AI Coding Assistants

### Claude Code

AI coding agent from Anthropic. Works with the `CLAUDE.md` file in the repo root for project context.

- **Install:** `npm install -g @anthropic-ai/claude-code`
- **Auth:** `claude` (follow the OAuth flow)
- **Usage:** `claude` in the repo root — it reads `CLAUDE.md` automatically
- [Documentation](https://docs.anthropic.com/en/docs/claude-code)

### Gemini CLI

Google's AI coding assistant.

- **Install:** `npm install -g @anthropic-ai/claude-code` is separate; for Gemini: `npm install -g @anthropic-ai/claude-code` — actually: `npm install -g @anthropic-ai/claude-code`
- **Install:** `npm install -g @google/gemini-cli`
- **Auth:** `gemini` (follow the OAuth flow)
- **Usage:** `gemini` in the repo root — reads `GEMINI.md` if present
- [Documentation](https://github.com/google-gemini/gemini-cli)

### OpenCode (Lash)

Terminal-based AI coding tool. Fork maintained at `lacymorrow/lash`.

- **Install:** `npm install -g @opencode-ai/opencode` or use the Lash fork
- **Usage:** `opencode` in the repo root
- [Documentation](https://github.com/anomalyco/opencode)

## CI / GitHub Actions

Shipkit includes workflows for:

- **Type checking** — `bun run typecheck`
- **Linting** — `bun run lint`
- **Build verification** — `bun run build`

No additional setup needed — these run on push via GitHub Actions.

## Environment Variables

See [env.mdx](../env.mdx) for the full list. Key ones to set up first:

- `ADMIN_EMAIL` — comma-separated admin emails
- `DATABASE_URL` — your database connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`

## Package Manager

Shipkit uses [Bun](https://bun.sh).

```bash
# Install bun
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install --frozen-lockfile

# Start dev server
bun dev
```

## Recommended VS Code Extensions

- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Drizzle ORM](https://marketplace.visualstudio.com/items?itemName=drizzle-team.drizzle-orm-vscode)
