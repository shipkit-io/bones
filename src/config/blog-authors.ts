/**
 * Blog Authors Configuration
 *
 * Centralized configuration for blog post authors.
 * This replaces hardcoded author data in MDX frontmatter.
 */

export interface BlogAuthor {
	/** Unique identifier for the author */
	id: string;
	/** Display name */
	name: string;
	/** Full name (optional, for formal contexts) */
	fullName?: string;
	/** Avatar image URL */
	avatar: string;
	/** Author bio/description */
	bio?: string;
	/** Author's website URL */
	website?: string;
	/** Author's Twitter handle (without @) */
	twitter?: string;
	/** Author's GitHub username */
	github?: string;
	/** Author's LinkedIn profile */
	linkedin?: string;
	/** Author's email (optional) */
	email?: string;
	/** Author's role/title */
	role?: string;
	/** Author's location */
	location?: string;
	/** Whether this author is active/current */
	isActive?: boolean;
}

/**
 * Blog Authors Database
 *
 * Add new authors here. The key should be URL-friendly (lowercase, no spaces).
 */
export const blogAuthors: Record<string, BlogAuthor> = {
	"lacy-morrow": {
		id: "lacy-morrow",
		name: "Lacy Morrow",
		fullName: "Lacy Morrow",
		avatar: "https://avatars.githubusercontent.com/u/1311301?v=4",
		bio: "Founder, developer, and product designer passionate about building tools that help developers ship faster.",
		website: "https://lacymorrow.com",
		twitter: "lacybuilds",
		github: "lacymorrow",
		email: "lacy@shipkit.io",
		role: "Founder & Engineer",
		location: "San Francisco, CA",
		isActive: true,
	},
	"shipkit-team": {
		id: "shipkit-team",
		name: "Shipkit Team",
		fullName: "Shipkit Team",
		avatar: "https://avatars.githubusercontent.com/u/191630682?v=4",
		bio: "The collective team behind Shipkit, working to make app development faster and more enjoyable.",
		website: "https://shipkit.io",
		twitter: "shipkit_io",
		github: "shipkit-io",
		email: "team@shipkit.io",
		role: "Engineering Team",
		location: "Remote",
		isActive: true,
	},
};

/**
 * Default/fallback author for posts without a specified author
 */
export const defaultAuthor: BlogAuthor = blogAuthors["lacy-morrow"] || (Object.values(blogAuthors)[0] as BlogAuthor);

/**
 * Get author by ID/slug
 *
 * @param authorId - The author's unique identifier
 * @returns The author object or default author if not found
 */
export function getAuthorById(authorId: string): BlogAuthor {
	return blogAuthors[authorId] || defaultAuthor;
}

/**
 * Get author by name (case-insensitive)
 *
 * @param name - The author's display name
 * @returns The author object or default author if not found
 */
export function getAuthorByName(name: string): BlogAuthor {
	const author = Object.values(blogAuthors).find(
		(author) => author.name.toLowerCase() === name.toLowerCase()
	);
	return author || defaultAuthor;
}

/**
 * Get multiple authors by their IDs
 *
 * @param authorIds - Array of author IDs
 * @returns Array of author objects
 */
export function getAuthorsByIds(authorIds: string[]): BlogAuthor[] {
	return authorIds.map(getAuthorById);
}

/**
 * Get all active authors
 *
 * @returns Array of active author objects
 */
export function getActiveAuthors(): BlogAuthor[] {
	return Object.values(blogAuthors).filter((author) => author.isActive !== false);
}

/**
 * Convert legacy author name to author object
 * This helps with backward compatibility for existing MDX files
 *
 * @param legacyName - The legacy author name from MDX frontmatter
 * @returns Author object
 */
export function convertLegacyAuthor(legacyName: string): BlogAuthor {
	// Try to find by name first
	const author = getAuthorByName(legacyName);

	// If not found, create a temporary author object
	if (author === defaultAuthor && legacyName !== defaultAuthor.name) {
		return {
			id: legacyName.toLowerCase().replace(/\s+/g, "-"),
			name: legacyName,
			avatar: defaultAuthor.avatar, // Use default avatar as fallback
			bio: `Guest author: ${legacyName}`,
			isActive: false,
		};
	}

	return author;
}

/**
 * Author display utilities
 */
export const authorUtils = {
	/**
	 * Get author's display name with fallback
	 */
	getDisplayName: (author: BlogAuthor): string => {
		return author.fullName || author.name;
	},

	/**
	 * Get author's social links
	 */
	getSocialLinks: (author: BlogAuthor) => {
		const links: { platform: string; url: string; handle: string }[] = [];

		if (author.twitter) {
			links.push({
				platform: "twitter",
				url: `https://twitter.com/${author.twitter}`,
				handle: `@${author.twitter}`,
			});
		}

		if (author.github) {
			links.push({
				platform: "github",
				url: `https://github.com/${author.github}`,
				handle: author.github,
			});
		}

		if (author.linkedin) {
			links.push({
				platform: "linkedin",
				url: `https://linkedin.com/in/${author.linkedin}`,
				handle: author.linkedin,
			});
		}

		if (author.website) {
			links.push({
				platform: "website",
				url: author.website,
				handle: author.website.replace(/^https?:\/\//, ""),
			});
		}

		return links;
	},

	/**
	 * Generate author page URL
	 */
	getAuthorUrl: (author: BlogAuthor): string => {
		return `/blog/authors/${author.id}`;
	},
};
