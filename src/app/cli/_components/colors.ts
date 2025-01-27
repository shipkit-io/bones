import Color from "color";

const GOLDEN_RATIO = 0.618033988749895;
const HUE_OFFSET = 0.7; // This gives us a nice starting point in the blue-green range

// Function to generate a distinct color based on a string
function generateColor(str: string): string {
	// Create a hash of the string
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	// Convert hash to float between 0 and 1
	const normalizedHash = Math.abs(hash) / 2 ** 32;

	// Use golden ratio to create well-distributed hues, with offset
	const hue = (normalizedHash + GOLDEN_RATIO + HUE_OFFSET) % 1;

	// Convert to degrees and ensure good saturation and lightness for visibility
	const h = Math.floor(hue * 360);
	const s = 70 + (hash % 15); // 70-85% - slightly more saturated
	const l = 60 + (hash % 8); // 60-68% - slightly brighter

	return Color.hsl(h, s, l).hex();
}

// Cache to store generated colors
const colorCache: Record<string, string> = {};

// Function to get or generate a color for a given key
export function getColor(key: string): string {
	if (!key) return "#666666"; // Default color for empty keys

	if (!colorCache[key]) {
		colorCache[key] = generateColor(key);
	}
	return colorCache[key];
}

// Export empty objects to maintain compatibility with existing code
export const libraryColors = {};
export const categoryColors = {};
