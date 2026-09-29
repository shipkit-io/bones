#!/usr/bin/env node
/**
 * Setup upstream remote for syncing with ShipKit/Bones
 * This script is designed to run during postinstall to automatically
 * configure the upstream remote for new developers.
 *
 * It will:
 * 1. Check if an upstream remote already exists (an existing remote always wins)
 * 2. If not, add UPSTREAM_REPO_URL when set
 * 3. Otherwise add shipkit-io/bones, the root of every ShipKit project
 */

import { execSync } from "node:child_process";

const UPSTREAM_REMOTE = "upstream";

// Bones is the root template. Projects created from another template (for example
// lacymorrow/shipkit) get their upstream remote set by create-shipkit-app, or set
// UPSTREAM_REPO_URL to override.
const UPSTREAM_REPOS: string[] = process.env.UPSTREAM_REPO_URL
  ? [process.env.UPSTREAM_REPO_URL]
  : ["https://github.com/shipkit-io/bones.git"];

/**
 * Run a command silently and return success status
 */
function runSilent(command: string): boolean {
  try {
    execSync(command, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a command and return output
 */
function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

/**
 * Check if we're in a git repository
 */
function isGitRepo(): boolean {
  return runSilent("git rev-parse --git-dir");
}

/**
 * Check if the upstream remote already exists
 */
function hasUpstreamRemote(): boolean {
  return runSilent(`git remote get-url ${UPSTREAM_REMOTE}`);
}

/**
 * Check if a remote repository is accessible
 */
function canAccessRepo(url: string): boolean {
  return runSilent(`git ls-remote ${url}`);
}

/**
 * Get the first accessible upstream URL
 */
function getAccessibleUpstreamUrl(): string | null {
  for (const url of UPSTREAM_REPOS) {
    if (canAccessRepo(url)) {
      return url;
    }
  }
  return null;
}

/**
 * Main setup function
 */
function setup(): void {
  // Skip if not in a git repository
  if (!isGitRepo()) {
    return;
  }

  // Skip if upstream already exists
  if (hasUpstreamRemote()) {
    const existingUrl = runCommand(`git remote get-url ${UPSTREAM_REMOTE}`);
    // Only log if running interactively (not during npm install)
    if (process.stdout.isTTY) {
      console.info(`✓ Upstream remote already configured: ${existingUrl}`);
    }
    return;
  }

  // Find accessible upstream
  const upstreamUrl = getAccessibleUpstreamUrl();

  if (!upstreamUrl) {
    // Silently skip if no upstream is accessible
    // (user might not have network access during install)
    return;
  }

  // Add the upstream remote
  if (runSilent(`git remote add ${UPSTREAM_REMOTE} ${upstreamUrl}`)) {
    console.info(`✓ Added upstream remote: ${upstreamUrl}`);
    console.info("  Run 'bun run upstream:pull' to sync changes from upstream");
  }
}

// Run setup
setup();
