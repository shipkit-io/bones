// Moved from "use server" to client-safe utility file

// Extract component ID from URL or just return the ID if no URL
export function extractComponentId(input: string): string | null {
	// If input is already just an ID (b_XXXXXX)
	if (/^b_[a-zA-Z0-9]+$/.test(input)) {
		return input;
	}

	// If input is a URL, extract the ID
	const urlMatch = /https?:\/\/v0\.dev\/(?:chat\/)?b\/([a-zA-Z0-9_]+)/.exec(input);
	// Using optional chaining to fix linter error
	return urlMatch?.[1] || null;
}

// Transform imports in component files to match project structure
export function transformImports(
	code: string,
	currentStructure: string,
	targetStructure: string
): string {
	// If the structures are the same, no transformation needed
	if (currentStructure === targetStructure) {
		return code;
	}

	// Replace imports from /app/ to /src/app/ or vice versa
	const fromPath = currentStructure === "app" ? "/app/" : "/src/app/";
	const toPath = targetStructure === "app" ? "/app/" : "/src/app/";

	return code.replace(new RegExp(fromPath, "g"), toPath);
}
