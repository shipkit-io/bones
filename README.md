# Shipkit Bones 🚀

Launch your app at light speed. Fast, flexible, and feature-packed for the modern web.

## Deploy in 30 Seconds

Get started with ShipKit in three easy steps:

1. **Click Deploy** 👇
2. **Connect to Vercel**
3. **Follow the Setup Wizard**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fshipkit-io%2Fbones&project-name=bones-app&repository-name=bones-app&redirect-url=https%3A%2F%2Fshipkit.io%2Fx%2Fvercel%2Fdeploy&developer-id=oac_KkY2TcPxIWTDtL46WGqwZ4BF&production-deploy-hook=Shipkit%20Deploy&demo-title=Bones%20%E2%80%93%20Next.js%20SaaS%20Starter&demo-description=Full-stack%20Next.js%20starter%20with%20Auth%2C%20Payments%2C%20CMS%2C%20AI%2C%20and%20100%2B%20components.%20Deploy%20in%2030%20seconds.&demo-url=https%3A%2F%2Fbones.sh&demo-image=https%3A%2F%2Fshipkit.io%2Fimages%2Fdemo.png)

[![Open in Codeflow](https://developer.stackblitz.com/img/open_in_codeflow.svg)](https://pr.new/shipkit-io/bones)

No environment variables needed to start. Features turn on when you add their env vars.

## What's Included

- ⚡️ **Next.js 16 + React 19** — Modern App Router foundation
- 🔐 **Authentication** — Auth.js v5 today with Discord, GitHub and Google providers; Better Auth is the chosen default and the switch is in progress
- 🎨 **Shadcn/UI** — Production-ready component library, fully owned in your repo
- 🚀 **Performance** — Edge-optimized defaults

> Bones is the root template. Payments, CMS, AI, storage and more are [ShipKit registry](https://shipkit.io/docs/features/registry) items you add one at a time with `npx shadcn add @shipkit/<item>`. [ShipKit](https://github.com/lacymorrow/shipkit) is the everything-included build of Bones that proves those integrations work together.

## Quick Start Guide

### 1. Deploy to Vercel

Click the "Deploy with Vercel" button above and follow the prompts.

### 2. Run Setup Wizard

After deployment, the wizard connects GitHub and Vercel and deploys. Everything else is env vars: add `DATABASE_URL`, `APP_SECRET` and the keys for the services you use, and the matching features turn on. See [Environment Variables](docs/env.mdx).

### 3. Add ShipKit integrations

```bash
npx shadcn add @shipkit/payments
npx shadcn add @shipkit/email
```

Each integration is a shadcn registry item. Browse them at [shipkit.io/docs/features/registry](https://shipkit.io/docs/features/registry).

## Development Tools

Built with modern technologies:

 - ⚡️ [Next.js 16](https://nextjs.org) - React Framework
- 🎨 [Tailwind CSS](https://tailwindcss.com) - Styling
- 🔧 [Shadcn/UI](https://ui.shadcn.com) - Components
- 🛠 [Drizzle](https://orm.drizzle.team) - Database ORM
- 🔑 [Auth.js](https://authjs.dev) - Authentication today; [Better Auth](https://better-auth.com) is the chosen default, switch in progress
- 📧 [Resend](https://resend.com) - Email Service

## Documentation

- [Quick Start](docs/getting-started/index.mdx)
- [Environment Variables](docs/env.mdx)
- [Development](docs/development.mdx)

## Support

Need help? We're here for you:

- 💬 [GitHub Discussions](https://github.com/shipkit-io/bones/discussions)
- 🐦 [Follow Updates](https://twitter.com/lacybuilds)
- 📧 [Email Support](mailto:support@shipkit.io)
- 🌐 [Website](https://shipkit.io)

## Found a bug?

Report it on [GitHub Issues](https://github.com/shipkit-io/bones/issues).

## License

FSL-1.1-MIT — source-available, free for any Permitted Purpose (internal use, education, research, professional services). Converts to MIT after 2 years. See [LICENSE](LICENSE) for full terms.

## Local Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

> **Note for maintainers:** [bones.sh](https://bones.sh) production deploys from **this repo** (`shipkit-io/bones`, branch `main`) via the Vercel project `bones`. The old `lacymorrow/bones-www` repo is archived and no longer deploys anywhere — changes for bones.sh belong here.

## Tools

- [v0](https://v0.dev)
- [Builder.io](https://builder.io)
- [Payload](https://payloadcms.com)
- [Resend](https://resend.com)
- [Shadcn](https://ui.shadcn.com)
- [MagicUI](https://magicui.design/)

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

### Shadcn

```bash
npx shadcn@latest add
```

### [MagicUI](https://magicui.design/)
