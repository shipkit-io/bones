/**
 * Avatar generation options
 */
export type AvatarType = "personal" | "workspace";

/**
 * Configuration for avatar generation
 */
interface AvatarConfig {
	/**
	 * The style of avatar to generate
	 * @see https://www.dicebear.com/styles/
	 */
	style: "glass" | "pixel-art";
	/**
	 * Array of hex colors (without #) to use for avatar backgrounds
	 */
	colors: string[];
}

/**
 * Configuration for different avatar types
 */
const AVATAR_CONFIGS: Record<AvatarType, AvatarConfig> = {
	personal: {
		style: "glass",
		colors: ["2ecc71", "3498db", "9b59b6", "f1c40f", "e74c3c", "1abc9c", "34495e"],
	},
	workspace: {
		style: "glass",
		colors: ["2ecc71", "3498db", "9b59b6", "f1c40f", "e74c3c", "1abc9c", "34495e"],
	},
};

/**
 * Generates a consistent hash for a string
 * @param str - The string to hash
 * @returns A number hash
 */
const hashString = (str: string): number => {
	return str.split("").reduce((acc, char) => {
		return char.charCodeAt(0) + ((acc << 5) - acc);
	}, 0);
};

/**
 * Generates a URL for an avatar using DiceBear API
 * @param name - The name to generate the avatar for
 * @param type - The type of avatar to generate (personal or workspace)
 * @returns A URL string for the avatar
 * @example
 * ```ts
 * const avatarUrl = getAvatarUrl("John Doe", "personal")
 * // => https://api.dicebear.com/9.x/glass/svg?seed=John%20Doe&backgroundColor=3498db
 * ```
 */
export const getAvatarUrl = (name: string, type: AvatarType = "workspace"): string => {
	const hash = hashString(name);
	const config = AVATAR_CONFIGS[type];
	const color = config.colors[Math.abs(hash) % config.colors.length];

	return `https://api.dicebear.com/9.x/${config.style}/svg?seed=${encodeURIComponent(name)}&backgroundColor=${color}`;
};
