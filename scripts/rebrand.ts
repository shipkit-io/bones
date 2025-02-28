#!/usr/bin/env tsx

/**
 * Rebranding Script
 *
 * This script updates the site configuration with new branding information.
 * It modifies the site.ts file to replace all branding references with new values.
 *
 * Usage:
 * ```
 * pnpm tsx scripts/rebrand.ts --name "MyApp" --domain "myapp.com"
 * ```
 *
 * Options:
 * --dry-run: Preview changes without writing to files
 *
 * All arguments are optional. If not provided, the script will prompt for them.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Create readline interface for prompting
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Helper function to prompt for input
const prompt = (question: string, defaultValue?: string): Promise<string> => {
	return new Promise((resolve) => {
		rl.question(`${question}${defaultValue ? ` (default: ${defaultValue})` : ''}: `, (answer) => {
			resolve(answer || defaultValue || '');
		});
	});
};

// Parse command line arguments
const args = process.argv.slice(2);
const argMap: Record<string, string> = {};
const flags: Record<string, boolean> = {};

for (let i = 0; i < args.length; i++) {
	if (args[i].startsWith('--')) {
		const arg = args[i].substring(2);
		// Check if it's a flag (no value)
		if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
			flags[arg] = true;
		} else {
			argMap[arg] = args[i + 1];
			i++;
		}
	}
}

// Check for dry run flag
const isDryRun = flags['dry-run'] || false;

// Main function
async function main() {
	console.log('🚀 Rebranding Script');
	console.log('====================');
	console.log('This script will update your site configuration with new branding information.');
	if (isDryRun) {
		console.log('\n⚠️ DRY RUN MODE: No files will be modified');
	}
	console.log('');

	// Get essential branding information
	const projectName = argMap.name || await prompt('Project Name', 'Shipkit');
	const projectSlug = argMap.slug || await prompt('Project Slug', projectName.toLowerCase().replace(/\s+/g, '-'));
	const domain = argMap.domain || await prompt('Domain', `${projectSlug}.com`);

	// Get creator information (optional)
	const creatorName = argMap['creator-name'] || await prompt('Your Name (optional)', '');

	// Derive other values from the essential information
	const githubOrg = `${projectSlug}-org`;
	const githubRepo = projectSlug;
	const creatorUsername = creatorName ? creatorName.toLowerCase().replace(/\s+/g, '') : projectSlug;
	const creatorEmail = `hello@${domain}`;
	const creatorDomain = creatorName ? `${creatorUsername}.com` : domain;
	const creatorTwitter = creatorUsername;
	const databaseName = projectSlug;
	const vercelProjectName = `${projectSlug}-app`;

	// Product names - keep the same structure but use the project name
	const bonesName = "Core";
	const musclesName = "Pro";
	const brainsName = "Enterprise";

	// Update site.ts
	console.log('\nUpdating site configuration...');

	const siteConfigPath = path.join(process.cwd(), 'src', 'config', 'site.ts');
	let siteConfig = fs.readFileSync(siteConfigPath, 'utf8');

	// Update branding section
	siteConfig = siteConfig.replace(
		/name: "([^"]+)"/,
		`name: "${projectName}"`
	);

	siteConfig = siteConfig.replace(
		/url: "([^"]+)"/,
		`url: "https://${domain}"`
	);

	siteConfig = siteConfig.replace(
		/ogImage: "([^"]+)"/,
		`ogImage: "https://${domain}/og"`
	);

	// Update branding section
	const brandingRegex = /branding: \{[\s\S]*?\},/;
	const newBranding = `branding: {
		projectName: "${projectName}",
		projectSlug: "${projectSlug}",
		productNames: {
			bones: "${bonesName}",
			muscles: "${musclesName}",
			brains: "${brainsName}",
			main: "${projectName}",
		},
		domain: "${domain}",
		protocol: "web+${projectSlug}",
		githubOrg: "${githubOrg}",
		githubRepo: "${githubRepo}",
		vercelProjectName: "${vercelProjectName}",
		databaseName: "${databaseName}",
	},`;

	siteConfig = siteConfig.replace(brandingRegex, newBranding);

	// Update creator section
	const creatorRegex = /creator: \{[\s\S]*?\},/;
	const newCreator = `creator: {
		name: "${creatorUsername}",
		email: "${creatorEmail}",
		url: "https://${creatorDomain}",
		twitter: "@${creatorTwitter}",
		twitter_handle: "${creatorTwitter}",
		domain: "${creatorDomain}",
		fullName: "${creatorName || `${projectName} Team`}",
		role: "Developer",
		avatar: "https://avatars.githubusercontent.com/u/1311301?v=4",
		location: "San Francisco, CA",
		bio: "Creator and developer.",
	},`;

	siteConfig = siteConfig.replace(creatorRegex, newCreator);

	// Update email section
	const emailRegex = /email: \{[\s\S]*?\},/;
	const newEmail = `email: {
		support: "support@${domain}",
		team: "team@${domain}",
		noreply: "noreply@${domain}",
		domain: "${domain}",
		legal: "legal@${domain}",
		privacy: "privacy@${domain}",
		format: (type: Exclude<keyof typeof siteConfig.email, "format">) => siteConfig.email[type],
	},`;

	siteConfig = siteConfig.replace(emailRegex, newEmail);

	// Update repo section
	const repoRegex = /repo: \{[\s\S]*?\},/;
	const newRepo = `repo: {
		owner: "${githubOrg}",
		name: "${githubRepo}",
		url: "https://github.com/${githubOrg}/${githubRepo}",
		format: {
			clone: () => \`https://github.com/\${siteConfig.repo.owner}/\${siteConfig.repo.name}.git\`,
			ssh: () => \`git@github.com:\${siteConfig.repo.owner}/\${siteConfig.repo.name}.git\`,
		},
	},`;

	siteConfig = siteConfig.replace(repoRegex, newRepo);

	// Update metadata keywords
	const keywordsRegex = /keywords: \[[\s\S]*?\],/;
	const newKeywords = `keywords: [
			"Next.js",
			"React",
			"Tailwind CSS",
			"Server Components",
			"${projectName}",
			"Shadcn",
			"UI Components",
		],`;

	siteConfig = siteConfig.replace(keywordsRegex, newKeywords);

	// Read .env.example and package.json
	const envExamplePath = path.join(process.cwd(), '.env.example');
	let envExample = fs.readFileSync(envExamplePath, 'utf8');

	envExample = envExample.replace(
		/DATABASE_URL="postgresql:\/\/postgres:password@localhost:5432\/([^"]+)"/,
		`DATABASE_URL="postgresql://postgres:password@localhost:5432/${databaseName}"`
	);

	const packageJsonPath = path.join(process.cwd(), 'package.json');
	let packageJson = fs.readFileSync(packageJsonPath, 'utf8');

	packageJson = packageJson.replace(
		/"name": "([^"]+)"/,
		`"name": "${projectSlug}"`
	);

	// If dry run, just show what would be changed
	if (isDryRun) {
		console.log('\n📝 Changes that would be made:');
		console.log('\n1. src/config/site.ts:');
		console.log(`  - Project name: Shipkit -> ${projectName}`);
		console.log(`  - Domain: shipkit.io -> ${domain}`);
		console.log(`  - GitHub: lacymorrow/shipkit -> ${githubOrg}/${githubRepo}`);
		console.log(`  - Creator: Lacy Morrow -> ${creatorName || `${projectName} Team`}`);

		console.log('\n2. .env.example:');
		console.log(`  - Database name: shipkit -> ${databaseName}`);

		console.log('\n3. package.json:');
		console.log(`  - Package name: ship-kit -> ${projectSlug}`);

		console.log('\n⚠️ No files were modified (dry run)');
	} else {
		// Write updated files
		fs.writeFileSync(siteConfigPath, siteConfig);
		console.log('✅ Updated src/config/site.ts');

		fs.writeFileSync(envExamplePath, envExample);
		console.log('✅ Updated .env.example');

		fs.writeFileSync(packageJsonPath, packageJson);
		console.log('✅ Updated package.json');

		// Run prettier to format files
		console.log('\nFormatting files...');
		try {
			execSync('pnpm format', { stdio: 'inherit' });
		} catch (error) {
			console.error('Error formatting files:', error);
		}
	}

	console.log('\n✅ Rebranding complete!');
	console.log(`Your project has been ${isDryRun ? 'prepared to be' : ''} rebranded to "${projectName}".`);

	if (!isDryRun) {
		console.log('\nNext steps:');
		console.log('1. Review the changes in src/config/site.ts');
		console.log('2. Update your .env file with the new database name');
		console.log('3. Restart your development server');
	} else {
		console.log('\nTo apply these changes, run the script without the --dry-run flag.');
	}

	rl.close();
}

main().catch((error) => {
	console.error('Error:', error);
	rl.close();
	process.exit(1);
});
