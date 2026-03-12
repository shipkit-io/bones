#!/usr/bin/env ts-node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

function runCommand(command: string) {
	try {
		execSync(command, { stdio: "inherit" });
	} catch (error) {}
}

function removeDirectory(dir: string) {
	const fullPath = path.join(rootDir, dir);
	if (fs.existsSync(fullPath)) {
		fs.rmSync(fullPath, { recursive: true, force: true });
	}
}

function removeFile(file: string) {
	const fullPath = path.join(rootDir, file);
	if (fs.existsSync(fullPath)) {
		fs.unlinkSync(fullPath);
	}
}

// Files to remove to match bones branch
const filesToRemove = [
	// Config files
	".env.test",
	".eslintignore",
	".eslintrc.json",
	".lintstagedrc.js",
	".ncurc",
	".npmrc",
	".nvmrc",
	".prettierignore",
	".vscode/settings.json",
	"next-sitemap.config.js",
	"vercel.json",
	"withLogFlare.ts",
	"vitest.config.browser.ts",
	"vitest.config.node.ts",
	"vitest.config.ts",
	"tsconfig.workers.json",
	"tsconfig.disabled.json",
	"troubleshooting.md",
	"todo.mdx",
	"start-database.sh",

	// Documentation
	"ai/brain.md",
	"ai/composer.md",
	"ai/context.ts",
	"ai/docs.md",
	"ai/persona.md",
	"ai/rules/notepads.md",
	"docs.mdx",
	"features.mdx",
	"guide.mdx",

	// Scripts
	"scripts/generate-registry.ts",
	"scripts/generator.ts",
	"scripts/push-to-downstream-remotes.sh",
	"scripts/scrape-aceternity.ts",
	"scripts/db-seed.ts",
	"scripts/db-sync.ts",
	"scripts/env-sync.sh",
	"scripts/sync-upstream.ts",
	"scripts/tsconfig.json",

	// Source directories to remove
	"src/app/(app)/(admin)",
	"src/app/(app)/ai",
	"src/app/(app)/(dashboard)",
	"src/app/(app)/(demo)",
	"src/app/(app)/(landing)",
	"src/app/(app)/(setup)",
	"src/app/(app)/animations",
	"src/app/(app)/blog",
	"src/app/(app)/docs",
	"src/app/(app)/illish",
	"src/app/(app)/launch",
	"src/app/(app)/logs",
	"src/app/(app)/settings",
	"src/app/(integrations)",
	"src/app/(payload)",
	"src/app/(task)",
	"src/app/cli",
	"src/app/cli-old",
	"src/app/guide",
	"src/app/mdx",
	"src/app/ui",
	"src/app/webhooks",

	// Components and UI
	"src/components/modules/builder",
	"src/components/footers/extended-footer.tsx",
	"src/components/forms/contact-form.tsx",
	"src/components/forms/feedback-popover.tsx",
	"src/components/forms/subscribe-form.tsx",
	"src/components/headers/extended-header.tsx",
	"src/components/layouts/blog-sidebar.tsx",
	"src/components/layouts/sidebar-layout.tsx",
	"src/components/primitives/accordion-list.tsx",
	"src/components/primitives/balancer.tsx",
	"src/components/primitives/masonry.tsx",
	"src/components/providers",
	"src/components/search",
	"src/components/setup-wizard",
	"src/components/share.tsx",
	"src/components/theme-toggle.tsx",
	"src/components/ui",

	// Content
	"src/content",
	"src/registry",

	// Server and services
	"src/server/middleware",
	"src/server/services",

	// Tests
	"tests",

	// Public assets
	"public/examples",
	"public/registry",
	"public/workers",
];

// Directories that must be removed first
const dirsToRemove = [
	"src/app/(app)/(admin)",
	"src/app/(app)/ai",
	"src/app/(app)/(dashboard)",
	"src/app/(app)/(demo)",
	"src/app/(app)/(landing)",
	"src/app/(app)/(setup)",
	"src/app/(app)/animations",
	"src/app/(app)/blog",
	"src/app/(app)/docs",
	"src/app/(app)/illish",
	"src/app/(app)/launch",
	"src/app/(app)/logs",
	"src/app/(app)/settings",
	"src/app/(integrations)",
	"src/app/(payload)",
	"src/app/(task)",
	"src/app/cli",
	"src/app/cli-old",
	"src/app/guide",
	"src/app/mdx",
	"src/app/ui",
	"src/app/webhooks",
	"src/components/modules/builder",
	"src/components/ui",
	"src/content",
	"src/registry",
	"src/server/middleware",
	"src/server/services",
	"tests",
	"public/examples",
	"public/registry",
	"public/workers",
];

// Handle different cleanup modes
if (process.argv.includes("--bones")) {
	// Clean to match bones branch

	// Remove directories first, then individual files
	for (const dir of dirsToRemove) {
		removeDirectory(dir);
	}

	for (const file of filesToRemove) {
		removeFile(file);
	}
} else if (process.argv.includes("--next")) {
	removeDirectory(".next");
} else {
	// Default cleanup
	const defaultDirs = ["node_modules", ".next", ".turbo"];
	const defaultFiles = ["pnpm-lock.yaml"];
	const additionalFolders = process.argv.slice(2);

	for (const dir of [...defaultDirs, ...additionalFolders]) {
		removeDirectory(dir);
	}

	for (const file of defaultFiles) {
		removeFile(file);
	}

	runCommand("pnpm store prune");
}
