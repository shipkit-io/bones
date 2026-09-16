import type { Metadata, Viewport } from "next";
import type { OpenGraph } from "next/dist/lib/metadata/types/opengraph-types";
import type { Twitter } from "next/dist/lib/metadata/types/twitter-types";
import { siteConfig } from "./site-config";

const defaultOpenGraph: OpenGraph = {
	type: "website",
	locale: "en_US",
	// Resolves against metadataBase + the current route's pathname, exactly
	// like alternates.canonical below, so og:url always matches the canonical.
	url: "./",
	title: siteConfig.title,
	description: siteConfig.description,
	siteName: siteConfig.name,
	images: [
		{
			url: siteConfig.ogImage,
			width: 1200,
			height: 630,
			alt: siteConfig.name,
		},
	],
};

// Single owner of the noindex policy: used by constructMetadata's noIndex
// flag and by segments (e.g. auth pages) that opt out of indexing wholesale.
export const noIndexRobots = { index: false, follow: true } as const;

const defaultTwitter: Twitter = {
	card: "summary_large_image",
	title: siteConfig.title,
	description: siteConfig.description,
	images: [
		{
			url: siteConfig.ogImage,
			width: 1200,
			height: 630,
			alt: siteConfig.name,
		},
	],
	creator: siteConfig.creator.twitter,
};

export const defaultMetadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: siteConfig.title,
		template: `%s | ${siteConfig.name}`,
	},
	description: siteConfig.description,
	applicationName: siteConfig.name,
	authors: [
		{
			name: siteConfig.creator.name,
			url: siteConfig.creator.url,
		},
	],
	creator: siteConfig.creator.name,
	publisher: siteConfig.name,
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	generator: "Next.js",
	keywords: siteConfig.metadata.keywords,
	referrer: "origin-when-cross-origin",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	// verification: {
	// 	google: "YOUR_VERIFICATION_CODE",
	// 	yandex: "your-yandex-verification",
	// },
	alternates: {
		canonical: "./",
		// languages: {
		// 	"en-US": "/en-US",
		// },
	},
	openGraph: defaultOpenGraph,
	twitter: defaultTwitter,
	appleWebApp: {
		capable: true,
		title: siteConfig.title,
		statusBarStyle: "default",
		startupImage: [
			{
				url: "/apple-touch-icon.png",
				media: "(device-width: 768px) and (device-height: 1024px)",
			},
		],
	},
	appLinks: {
		web: {
			url: siteConfig.url,
			should_fallback: true,
		},
	},
	// archives: [`${siteConfig.url}/blog`], // TODO: Add blog
	// assets: [`${siteConfig.url}/assets`], // TODO: Add assets
	bookmarks: [`${siteConfig.url}/`],
	category: "technology",
	classification: "Business Software",
};

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{
			media: "(prefers-color-scheme: light)",
			color: siteConfig.metadata.themeColor.light,
		},
		{
			media: "(prefers-color-scheme: dark)",
			color: siteConfig.metadata.themeColor.dark,
		},
	],
};

type ConstructMetadataProps = Metadata & {
	images?: { url: string; width: number; height: number; alt: string }[];
	noIndex?: boolean;
};

export const constructMetadata = ({
	images = [],
	noIndex = false,
	...metadata
}: ConstructMetadataProps = {}): Metadata => ({
	...defaultMetadata,
	...metadata,
	openGraph: {
		...defaultOpenGraph,
		title: metadata.title ?? defaultOpenGraph.title,
		description: metadata.description ?? defaultOpenGraph.description,
		images: images.length > 0 ? images : defaultOpenGraph.images,
	},
	twitter: {
		...defaultTwitter,
		title: metadata.title ?? defaultTwitter.title,
		description: metadata.description ?? defaultTwitter.description,
		images: images.length > 0 ? images : defaultTwitter.images,
	},
	robots: noIndex ? noIndexRobots : defaultMetadata.robots,
});

// Route-specific metadata for better CTR.
// Titles omit the site name: the (app) layout's title template appends
// `| ${siteConfig.name}` to child segments. Descriptions stay within the
// 110-160 character range Ahrefs considers healthy (LAC-3521).
export const routeMetadata = {
	home: {
		title: `${siteConfig.branding.projectName} - Free Open-Source Next.js SaaS Boilerplate`,
		description:
			`${siteConfig.branding.projectName} is a free, open-source Next.js starter kit with authentication, Shadcn UI, and one-click Vercel deploy. Ship production-ready React apps in minutes.`,
	},
	features: {
		title: "Features - Modern App Development Made Simple",
		description:
			`Discover how ${siteConfig.branding.projectName} accelerates app development with Builder.io, Payload CMS, Auth.js, and more. Get enterprise-grade features without the complexity.`,
	},
	pricing: {
		title: "Simple, Transparent Pricing",
		description:
			"Choose the perfect plan for your app. Start free, scale as you grow. All plans include core features, world-class support, and automatic updates.",
	},
	docs: {
		title: "Documentation - Build Better Apps Faster",
		description:
			`Comprehensive guides, API references, and examples to help you build production-ready apps with ${siteConfig.branding.projectName}. From quick starts to advanced topics.`,
	},
	faq: {
		title: "FAQ - Frequently Asked Questions",
		description:
			`Answers to common questions about ${siteConfig.branding.projectName} — setup, deployment, pricing, features, licensing, and support for your projects.`,
	},
	contact: {
		title: "Contact Us",
		description:
			`Get in touch with the ${siteConfig.branding.projectName} team. We are here to help with setup questions, feedback, bug reports, and support for your ${siteConfig.branding.projectName}-powered projects.`,
	},
	about: {
		title: "About",
		description:
			`Learn about ${siteConfig.branding.projectName}, our mission, and the team behind the platform. Building modern tools for developers who ship fast.`,
	},
	privacy: {
		title: "Privacy Policy",
		description:
			`How ${siteConfig.branding.projectName} handles your data: what we collect, how we store it, and your rights. Our commitment to transparency, security, and your privacy.`,
	},
	terms: {
		title: "Terms of Service",
		description:
			`Terms and conditions for using ${siteConfig.branding.projectName}. Read our service agreement, acceptable use policies, disclaimers, and your rights and responsibilities.`,
	},
	eula: {
		title: "End User License Agreement",
		description:
			"End User License Agreement for the Vercel Shipkit integration. Read the license terms, restrictions, and your rights as a user of the integration.",
	},
	changelog: {
		title: "Changelog",
		description:
			`Latest updates, improvements, and releases for ${siteConfig.branding.projectName}. Follow new features, bug fixes, and breaking changes as we ship them.`,
	},
};
