/**
 * @fileoverview Environment configuration loader for Shipkit
 * @module config/env-config
 *
 * This file ensures environment variables are loaded from .env files
 * before the main application starts. It's particularly important for:
 * - Build-time environment variable access
 * - Server-side rendering with proper env vars
 * - CLI scripts that need env configuration
 *
 * @remarks
 * Uses Next.js built-in env loading which supports:
 * - .env.local (highest priority, git-ignored)
 * - .env.production / .env.development
 * - .env (lowest priority, committed to git)
 *
 * @see https://nextjs.org/docs/basic-features/environment-variables
 */

import { loadEnvConfig } from "@next/env";

// Load environment variables from .env files
const projectDir = process.cwd();
loadEnvConfig(projectDir);
