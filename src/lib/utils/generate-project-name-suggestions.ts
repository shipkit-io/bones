/**
 * Generate suggested project names based on repository name
 */
export function generateProjectNameSuggestions(repoName: string): string[] {
	const sanitized = repoName.toLowerCase().replace(/[^a-z0-9]/g, "-");
	const suggestions = [
		sanitized,
		`${sanitized}-app`,
		`${sanitized}-web`,
		`${sanitized}-site`,
		`my-${sanitized}`,
	];

	// Remove duplicates and invalid names
	return [...new Set(suggestions)].filter(
		(name) =>
			name.length <= 52 &&
			/^[a-z0-9-]+$/.test(name) &&
			!name.startsWith("-") &&
			!name.endsWith("-") &&
			!name.includes("--")
	);
}
