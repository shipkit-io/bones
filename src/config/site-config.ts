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

	name: "Bones",
	title: "Launch your app today",
	url: "https://bones.sh",
	ogImage: "https://bones.sh/og",
	description:
		"Free, open-source Next.js SaaS boilerplate with authentication, Shadcn UI, and one-click Vercel deploy. The fastest way to launch a production-ready React app.",

	branding: {
		projectName: "Bones",
		projectSlug: "bones",
		productNames: {
			bones: "Bones",
			muscles: "Muscles",
			brains: "Brains",
			main: "Bones",
		},
		domain: "bones.sh",
		protocol: "web+bones",
		githubOrg: "bones-sh",
		githubRepo: "bones",
		vercelProjectName: "bones-app",
		databaseName: "bones",
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
		name: "bones",
		url: "https://github.com/shipkit-io/bones",
		format: {
			clone: () => "https://github.com/shipkit-io/bones.git",
			ssh: () => "git@github.com:shipkit-io/bones.git",
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
			"Next.js boilerplate",
			"Next.js SaaS starter",
			"React starter kit",
			"free Next.js template",
			"open source SaaS boilerplate",
			"Next.js authentication",
			"Shadcn UI",
			"Tailwind CSS",
			"TypeScript starter",
			"Vercel deploy",
			"Server Components",
			"App Router",
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
