#!/usr/bin/env tsx

/**
 * Rebranding Script
 *
 * This script updates the site configuration with new branding information.
 * It modifies the site-config.ts file to replace all branding references with new values.
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

	// Update site-config.ts
	console.log('\nUpdating site configuration...');

	const siteConfigPath = path.join(process.cwd(), 'src', 'config', 'site-config.ts');
	let siteConfig = fs.readFileSync(siteConfigPath, 'utf8');

	// We need to identify the export declaration and handle the branding info correctly
	// Find where the actual siteConfig object starts
	const siteConfigStartPattern = /export const siteConfig: SiteConfig = \{/;
	const siteConfigMatch = siteConfig.match(siteConfigStartPattern);

	if (!siteConfigMatch) {
		console.error('Could not find siteConfig export in site-config.ts');
		process.exit(1);
	}

	const siteConfigStart = siteConfigMatch.index!;
	const beforeConfig = siteConfig.substring(0, siteConfigStart + siteConfigMatch[0]!.length);
	let afterConfig = siteConfig.substring(siteConfigStart + siteConfigMatch[0]!.length);

	// Handle replacement of individual keys in the object
	// Name
	afterConfig = afterConfig.replace(
		/\n\tname: "([^"]+)"/,
		`\n\tname: "${projectName}"`
	);

	// URL
	afterConfig = afterConfig.replace(
		/\n\turl: "([^"]+)"/,
		`\n\turl: "https://${domain}"`
	);

	// OG Image
	afterConfig = afterConfig.replace(
		/\n\togImage: "([^"]+)"/,
		`\n\togImage: "https://${domain}/og"`
	);

	// Description - keep original but update if needed

	// Branding section
	const brandingPattern = /\n\tbranding: \{[\s\S]*?\n\t\},/;
	const newBranding = `\n\tbranding: {
\t\tprojectName: "${projectName}",
\t\tprojectSlug: "${projectSlug}",
\t\tproductNames: {
\t\t\tbones: "${bonesName}",
\t\t\tmuscles: "${musclesName}",
\t\t\tbrains: "${brainsName}",
\t\t\tmain: "${projectName}",
\t\t},
\t\tdomain: "${domain}",
\t\tprotocol: "web+${projectSlug}",
\t\tgithubOrg: "${githubOrg}",
\t\tgithubRepo: "${githubRepo}",
\t\tvercelProjectName: "${vercelProjectName}",
\t\tdatabaseName: "${databaseName}",
\t},`;

	afterConfig = afterConfig.replace(brandingPattern, newBranding);

	// Repository section
	const repoPattern = /\n\trepo: \{[\s\S]*?\n\t\},/;
	const newRepo = `\n\trepo: {
\t\towner: "${githubOrg}",
\t\tname: "${githubRepo}",
\t\turl: "https://github.com/${githubOrg}/${githubRepo}",
\t\tformat: {
\t\t\tclone: () => "https://github.com/${githubOrg}/${githubRepo}.git",
\t\t\tssh: () => "git@github.com:${githubOrg}/${githubRepo}.git",
\t\t},
\t},`;

	afterConfig = afterConfig.replace(repoPattern, newRepo);

	// Email section
	const emailPattern = /\n\temail: \{[\s\S]*?\n\t\},/;
	const newEmail = `\n\temail: {
\t\tsupport: "support@${domain}",
\t\tteam: "team@${domain}",
\t\tnoreply: "noreply@${domain}",
\t\tdomain: "${domain}",
\t\tlegal: "legal@${domain}",
\t\tprivacy: "privacy@${domain}",
\t\tformat: (type) => siteConfig.email[type],
\t},`;

	afterConfig = afterConfig.replace(emailPattern, newEmail);

	// Creator section
	const creatorPattern = /\n\tcreator: \{[\s\S]*?\n\t\},/;
	const newCreator = `\n\tcreator: {
\t\tname: "${creatorUsername}",
\t\temail: "${creatorEmail}",
\t\turl: "https://${creatorDomain}",
\t\ttwitter: "@${creatorTwitter}",
\t\ttwitter_handle: "${creatorTwitter}",
\t\tdomain: "${creatorDomain}",
\t\tfullName: "${creatorName || `${projectName} Team`}",
\t\trole: "Developer",
\t\tavatar: "https://avatars.githubusercontent.com/u/1311301?v=4",
\t\tlocation: "San Francisco, CA",
\t\tbio: "Creator and developer.",
\t},`;

	afterConfig = afterConfig.replace(creatorPattern, newCreator);

	// Metadata keywords
	const keywordsPattern = /\n\t\tkeywords: \[[\s\S]*?\n\t\t\],/;
	const newKeywords = `\n\t\tkeywords: [
\t\t\t"Next.js",
\t\t\t"React",
\t\t\t"Tailwind CSS",
\t\t\t"Server Components",
\t\t\t"${projectName}",
\t\t\t"Shadcn",
\t\t\t"UI Components",
\t\t],`;

	afterConfig = afterConfig.replace(keywordsPattern, newKeywords);

	// Put the file back together
	siteConfig = beforeConfig + afterConfig;

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
		console.log('\n1. src/config/site-config.ts:');
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
		console.log('✅ Updated src/config/site-config.ts');

		fs.writeFileSync(envExamplePath, envExample);
		console.log('✅ Updated .env.example');

		fs.writeFileSync(packageJsonPath, packageJson);
		console.log('✅ Updated package.json');

		// Run formatter
		console.log('\nFormatting files...');
		try {
			execSync('pnpm prettier --write src/config/site-config.ts || echo "Formatting skipped"', { stdio: 'inherit' });
		} catch (error) {
			console.error('Error formatting files:', error);
		}
	}

	console.log('\n✅ Rebranding complete!');
	console.log(`Your project has been ${isDryRun ? 'prepared to be' : ''} rebranded to "${projectName}".`);

	if (!isDryRun) {
		console.log('\nNext steps:');
		console.log('1. Review the changes in src/config/site-config.ts');
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
