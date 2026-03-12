#!/usr/bin/env node
/**
 * Setup upstream remote for syncing with ShipKit/Bones
 * This script is designed to run during postinstall to automatically
 * configure the upstream remote for new developers.
 *
 * It will:
 * 1. Check if an upstream remote already exists
 * 2. If not, try to add shipkit-io/shipkit (premium) first
 * 3. Fall back to shipkit-io/bones (public) if premium is inaccessible
 */

import { execSync } from "node:child_process";

const UPSTREAM_REMOTE = "upstream";

// Upstream repos in order of preference (premium first, then public fallback)
const UPSTREAM_REPOS = [
	"https://github.com/shipkit-io/shipkit.git", // Premium (try first)
	"https://github.com/shipkit-io/bones.git", // Public fallback
];

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

