# Security Policy

## Reporting a vulnerability

Please **do not** open public GitHub issues for security vulnerabilities.

Use one of these private channels instead:

1. **GitHub Security Advisory** (preferred) — [open a private advisory](https://github.com/shipkit-io/bones/security/advisories/new).
2. **Email** — `security@shipkit.io`.

You should expect:

- An acknowledgement within **3 business days**.
- An initial assessment (confirmed / not-reproducible / out-of-scope) within **10 business days**.
- Coordinated disclosure with credit to the reporter once a fix ships.

## In scope

Bones is a self-deployable Next.js boilerplate. Issues that affect any deployment derived from this repo are in scope:

- Authentication and session handling (NextAuth, Better Auth, Payload credentials)
- Authorization / role escalation (admin endpoints, ownership boundaries)
- SSRF / open redirects / injection in any user-facing input
- Stored or reflected XSS, CSRF on state-changing endpoints
- Payment / billing flows (Lemon Squeezy, Stripe, Polar) that bypass authorization or leak data
- Secret or PII exposure in API responses, logs, or error pages
- Misconfigured defaults that would compromise a fresh deployment (e.g., dev secrets accepted in production, permissive CORS, missing rate limits on auth)

## Out of scope

- Vulnerabilities that require an already-compromised admin account
- Best-practice findings without a working PoC (missing headers, outdated lib versions with no exploit) — file as normal issues
- Volumetric denial of service
- Issues in third-party services (Auth.js, Payload, Drizzle, etc.) — report those upstream

## Downstream deployments

Bones is the upstream for [`shipkit`](https://github.com/lacymorrow/shipkit) and a number of derived sites. If you find an issue in a deployed downstream site (e.g., `shipkit.io`), please report it to that site's security contact instead — we'll backport the fix to bones if it's upstream-relevant.

## Supported versions

Only `main` is supported. Tagged releases (`0.x`) are reference points for downstream syncs, not maintenance branches. If you're running an older `main`, please update first.
