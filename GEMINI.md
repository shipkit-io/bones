# GEMINI.md

## Project Overview

This project, **Shipkit**, is a comprehensive Next.js starter kit designed for rapid application development. It comes pre-configured with a wide range of features, including authentication, payments, a content management system (CMS), a visual editor, and more. The project is built with a focus on modern web development practices, including a robust feature-flagging system that allows for easy customization and extension.

**Key Technologies:**

*   **Framework:** Next.js 15
*   **Styling:** Tailwind CSS with Shadcn/UI components
*   **Database ORM:** Drizzle
*   **Authentication:** Auth.js with multiple providers (Google, GitHub, etc.)
*   **CMS:** Payload CMS
*   **Visual Editor:** Builder.io
*   **Email:** Resend
*   **Deployment:** Vercel

**Architecture:**

The project follows a standard Next.js project structure with the `src` directory. It utilizes the Next.js App Router with route groups for organizing different parts of the application. A key architectural feature is the extensive use of environment variables for feature flagging, allowing developers to easily enable or disable specific functionalities.

## Building and Running

**Installation:**

```bash
bun install --frozen-lockfile
```

**Running in Development:**

```bash
bun dev
```

This will start the Next.js development server on `http://localhost:3000`.

**Building for Production:**

```bash
bun run build
```

**Testing:**

The project uses `vitest` for unit testing and `playwright` for end-to-end testing.

*   Run all tests:
    ```bash
    bun run test
    ```
*   Run unit tests:
    ```bash
    bun run test:node
    ```
*   Run browser tests:
    ```bash
    bun run test:browser
    ```
*   Run end-to-end tests:
    ```bash
    bun run test:e2e
    ```

## Development Conventions

*   **Feature Flagging:** Features are enabled or disabled using environment variables. The configuration for this is in `src/config/features-config.ts`. To enable a feature, you typically set an environment variable like `ENABLE_FEATURE_X` to `true`.
*   **Styling:** The project uses Tailwind CSS for styling. Custom styles are located in the `src/styles` directory.
*   **Components:** Reusable UI components are located in the `src/components` directory.
*   **Linting and Formatting:** The project uses ESLint, Prettier, and Biome for code linting and formatting. You can run the linters with `bun run lint` and fix issues with `bun run lint:fix`.
*   **Committing:** The project uses `lint-staged` to run linters on staged files before committing.
*   **Database:** The project uses Drizzle ORM for database access. Database-related scripts are available in `package.json` (e.g., `bun run db:generate`, `bun run db:migrate`).
