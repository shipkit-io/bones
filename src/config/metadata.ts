import type { Metadata, Viewport } from "next";
import type { OpenGraph } from "next/dist/lib/metadata/types/opengraph-types";
import type { Twitter } from "next/dist/lib/metadata/types/twitter-types";
import { siteConfig } from "./site-config";

// Helper function to safely extract the default title string
const getDefaultTitleString = (title: Metadata["title"]): string | undefined => {
	if (typeof title === "string") {
		return title;
	}
	if (title && typeof title === "object" && "default" in title) {
		return title.default ?? undefined; // Return undefined if title.default is null
	}
	return undefined;
};

const defaultOpenGraph: OpenGraph = {
	type: "website",
	locale: siteConfig.metadata.locale,
	url: siteConfig.url,
	title: siteConfig.title,
	description: siteConfig.description,
	siteName: siteConfig.title,
	images: [
		{
			url: siteConfig.ogImage,
			width: siteConfig.metadata.openGraph.imageWidth,
			height: siteConfig.metadata.openGraph.imageHeight,
			alt: siteConfig.title,
		},
	],
};

const defaultTwitter: Twitter = {
	card: siteConfig.metadata.twitter.card,
	title: siteConfig.title,
	description: siteConfig.description,
	images: [
		{
			url: siteConfig.ogImage,
			width: siteConfig.metadata.openGraph.imageWidth,
			height: siteConfig.metadata.openGraph.imageHeight,
			alt: siteConfig.title,
		},
	],
	creator: siteConfig.creator.twitter,
};

export const defaultMetadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: siteConfig.title,
		template: `%s | ${siteConfig.tagline}`,
	},
	description: siteConfig.description,
	applicationName: siteConfig.title,
	authors: [
		{
			name: siteConfig.creator.name,
			url: siteConfig.creator.url,
		},
	],
	creator: siteConfig.creator.name,
	publisher: siteConfig.title,
	formatDetection: siteConfig.metadata.formatDetection,
	generator: siteConfig.metadata.generator,
	keywords: siteConfig.metadata.keywords,
	referrer: siteConfig.metadata.referrer,
	robots: siteConfig.metadata.robots,
	alternates: siteConfig.metadata.alternates,
	openGraph: defaultOpenGraph,
	twitter: defaultTwitter,
	appleWebApp: siteConfig.metadata.appleWebApp,
	appLinks: siteConfig.metadata.appLinks,
	archives: siteConfig.metadata.blogPath ? [siteConfig.metadata.blogPath] : [],
	assets: [siteConfig.metadata.assetsPath],
	bookmarks: [siteConfig.metadata.bookmarksPath],
	category: siteConfig.metadata.category,
	classification: siteConfig.metadata.classification,
	// Repository discovery meta tags
	other: {
		repository: siteConfig.repo.url,
		source: siteConfig.repo.url,
	},
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

export interface HeadLinkHint {
	rel: string;
	href: string;
	crossOrigin?: "anonymous" | "use-credentials";
}

// Shared head link hints used by both App and Pages routers
export const headLinkHints: readonly HeadLinkHint[] = [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
	{ rel: "dns-prefetch", href: "https://vercel.com" },
	{ rel: "dns-prefetch", href: "https://api.github.com" },
	{ rel: "dns-prefetch", href: "https://cdn.jsdelivr.net" },
	// Repository discovery (vcs-git convention)
	{ rel: "vcs-git", href: siteConfig.repo.url },
] as const;

type ConstructMetadataProps = Metadata & {
	images?: { url: string; width: number; height: number; alt: string }[];
	noIndex?: boolean;
};

export const constructMetadata = ({
	images = [],
	noIndex = false,
	...metadata
}: ConstructMetadataProps = {}): Metadata => {
	// Use helper function to get title strings
	const metaTitleString = getDefaultTitleString(metadata.title);
	const defaultMetaTitleString = getDefaultTitleString(defaultMetadata.title);

	return {
		...defaultMetadata,
		...metadata,
		openGraph: {
			...defaultOpenGraph,
			// Assign the extracted title string or fallback
			title: metaTitleString ?? defaultMetaTitleString,
			// Ensure description is not null
			description: (metadata.description ?? defaultMetadata.description) ?? undefined,
			images: images.length > 0 ? images : defaultOpenGraph.images,
		},
		twitter: {
			...defaultTwitter,
			// Assign the extracted title string or fallback
			title: metaTitleString ?? defaultMetaTitleString,
			// Ensure description is not null
			description: (metadata.description ?? defaultMetadata.description) ?? undefined,
			images: images.length > 0 ? images : defaultTwitter.images,
		},
		robots: noIndex ? { index: false, follow: true } : defaultMetadata.robots,
	};
};

// Route-specific metadata for better CTR
export const routeMetadata = {
	home: {
		title: `${siteConfig.title} - ${siteConfig.tagline}`,
		description: `Transform your app idea into reality with ${siteConfig.title}'s all-in-one development platform. Built with Next.js, TypeScript, and modern tools for rapid, production-ready deployment.`,
	},
	features: {
		title: `Features - Modern App Development Made Simple | ${siteConfig.title}`,
		description: `Discover how ${siteConfig.title} accelerates app development with Builder.io, Payload CMS, Auth.js, and more. Get enterprise-grade features without the complexity.`,
	},
	pricing: {
		title: `Simple, Transparent Pricing | ${siteConfig.title}`,
		description:
			"Choose the perfect plan for your app. Start free, scale as you grow. All plans include core features, world-class support, and automatic updates.",
	},
	docs: {
		title: `Documentation - Build Better Apps Faster | ${siteConfig.title}`,
		description: `Comprehensive guides, API references, and examples to help you build production-ready apps with ${siteConfig.title}. From quick starts to advanced topics.`,
	},
};
