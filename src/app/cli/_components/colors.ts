/**
 * Generate a deterministic color from a string using HSL color space
 * @param str Input string to generate color from
 * @returns HSL color string
 */
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

/**
 * Get a deterministic color for a given name
 * Uses HSL color space for better control over saturation and lightness
 */
export function getColor(name: string): string {
	if (!name) return "#666666"; // Default color for empty names

	const hash = hashString(name);
	const hue = hash % 360;
	const saturation = 70; // Fixed saturation for consistent vibrancy
	const lightness = 50; // Fixed lightness for consistent visibility
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Export empty objects to maintain compatibility with existing code
export const libraryColors = {};
export const categoryColors = {};
