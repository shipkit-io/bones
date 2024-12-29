import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";

import { RootLayout } from "@/components/layouts/root-layout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
	title: {
		default: siteConfig.title,
		template: `%s - ${siteConfig.name}`,
	},
	metadataBase: new URL(siteConfig.url),
	description: siteConfig.description,
	keywords: ["Next.js", "React", "Tailwind CSS", "Server Components"],
	authors: [
		{
			name: siteConfig.creator.name,
			url: siteConfig.creator.url,
		},
	],
	creator: siteConfig.creator.name,
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: siteConfig.url,
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
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.title,
		description: siteConfig.description,
		images: [siteConfig.ogImage],
		creator: siteConfig.creator.twitter,
	},
	appleWebApp: {
		capable: true,
		title: siteConfig.title,
		startupImage: [
			{
				url: "/apple-icon.png",
			},
		],
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
};

export default function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <RootLayout>{children}</RootLayout>;
}
