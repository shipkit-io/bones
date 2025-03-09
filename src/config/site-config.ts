/**
 * Site Configuration
 *
 * Central configuration for site-wide settings, branding, and metadata.
 * Used throughout the application for consistent branding and functionality.
 */

interface SiteConfig {
	// Core site information
	name: string;
	title: string;
	url: string;
	ogImage: string;
	description: string;

	// UI behavior settings
	behavior: {
		pageTransitions: boolean;
	};

	// Branding information
	branding: {
		projectName: string;
		projectSlug: string;
		productNames: {
			bones: string;
			muscles: string;
			brains: string;
			main: string;
		};
		domain: string;
		protocol: string;
		githubOrg: string;
		githubRepo: string;
		vercelProjectName: string;
		databaseName: string;
	};

	// External links
	links: {
		twitter: string;
		twitter_follow: string;
		x: string;
		x_follow: string;
		github: string;
	};

	// Repository information
	repo: {
		owner: string;
		name: string;
		url: string;
		format: {
			clone: () => string;
			ssh: () => string;
		};
	};

	// Email addresses and formatting
	email: {
		support: string;
		team: string;
		noreply: string;
		domain: string;
		legal: string;
		privacy: string;
		format: (type: Exclude<keyof SiteConfig['email'], 'format'>) => string;
	};

	// Creator information
	creator: {
		name: string;
		email: string;
		url: string;
		twitter: string;
		twitter_handle: string;
		domain: string;
		fullName: string;
		role: string;
		avatar: string;
		location: string;
		bio: string;
	};

	// E-commerce store configuration
	store: {
		domain: string;
		products: {
			bones: string;
			muscles: string;
			brains: string;
			shipkit: string;
		};
		format: {
			buyUrl: (product: keyof SiteConfig['store']['products']) => string;
		};
	};

	// Admin access control
	admin: {
		emails: string[];
		domains: string[];
		isAdmin: (email: string) => boolean;
	};

	// SEO and metadata
	metadata: {
		keywords: string[];
		themeColor: {
			light: string;
			dark: string;
		};
	};

	// Application settings
	app: {
		apiKeyPrefix: string;
	};
}

export const siteConfig: SiteConfig = {
	behavior: {
		pageTransitions: true,
	},

	name: "Shipkit",
	title: "Launch your app today",
	url: "https://shipkit.io",
	ogImage: "https://shipkit.io/og",
	description:
		"Launch your app at light speed. Fast, flexible, and feature-packed for the modern web.",

	branding: {
		projectName: "Shipkit",
		projectSlug: "shipkit",
		productNames: {
			bones: "Bones",
			muscles: "Muscles",
			brains: "Brains",
			main: "Shipkit",
		},
		domain: "shipkit.io",
		protocol: "web+shipkit",
		githubOrg: "shipkit-io",
		githubRepo: "bones",
		vercelProjectName: "bones-app",
		databaseName: "shipkit",
	},

	links: {
		twitter: "https://twitter.com/lacybuilds",
		twitter_follow: "https://twitter.com/intent/follow?screen_name=lacybuilds",
		x: "https://x.com/lacybuilds",
		x_follow: "https://x.com/intent/follow?screen_name=lacybuilds",
		github: "https://github.com/lacymorrow/shipkit",
	},

	repo: {
		owner: "lacymorrow",
		name: "shipkit",
		url: "https://github.com/lacymorrow/shipkit",
		format: {
			clone: () => "https://github.com/lacymorrow/shipkit.git",
			ssh: () => "git@github.com:lacymorrow/shipkit.git",
		},
	},

	email: {
		support: "feedback@shipkit.io",
		team: "team@shipkit.io",
		noreply: "noreply@shipkit.io",
		domain: "shipkit.io",
		legal: "legal@shipkit.io",
		privacy: "privacy@shipkit.io",
		format: (type) => siteConfig.email[type],
	},

	creator: {
		name: "lacymorrow",
		email: "lacy@shipkit.io",
		url: "https://lacymorrow.com",
		twitter: "@lacybuilds",
		twitter_handle: "lacybuilds",
		domain: "lacymorrow.com",
		fullName: "Lacy Morrow",
		role: "Engineer",
		avatar: "https://avatars.githubusercontent.com/u/1311301?v=4",
		location: "San Francisco, CA",
		bio: "Founder, developer, and product designer.",
	},

	store: {
		domain: "shipkit.lemonsqueezy.com",
		products: {
			bones: "eb159dba-96a3-40f2-a97b-7b9117e635a1",
			muscles: "4d259175-0a79-486a-b0f8-b77404ee68df",
			brains: "7935a386-7cd0-47fe-83c8-cab101323591",
			shipkit: "20b5b59e-b4c4-43b0-9979-545f90c76f28",
		},
		format: {
			buyUrl: (product) =>
				`https://shipkit.lemonsqueezy.com/checkout/buy/${siteConfig.store.products[product]}`,
		},
	},

	admin: {
		emails: ["lacymorrow0@gmail.com", "gojukebox@gmail.com"],
		domains: ["lacymorrow.com"],
		isAdmin: (email) =>
			siteConfig.admin.emails.includes(email) ||
			siteConfig.admin.domains.some((domain) => email?.endsWith(`@${domain}`)),
	},

	metadata: {
		keywords: [
			"Next.js",
			"React",
			"Tailwind CSS",
			"Server Components",
			"Shipkit",
			"Shadcn",
			"UI Components",
		],
		themeColor: {
			light: "white",
			dark: "black",
		},
	},

	app: {
		apiKeyPrefix: "sk",
	},
};
