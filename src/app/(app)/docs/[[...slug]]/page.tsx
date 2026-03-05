import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Suspense } from "react";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { getAllDocSlugsFromFileSystem, getDocFromParams } from "@/lib/docs";
import { useMDXComponents } from "@/mdx-components";

interface PageProps {
	params: Promise<{
		slug: string[];
	}>;
}

export async function generateStaticParams() {
	const slugs = await getAllDocSlugsFromFileSystem();

	return slugs.map((slug: string) => {
		// For the index page, return empty array for slug
		if (slug === "index") {
			return { slug: [] };
		}
		// For other pages, split the slug into segments
		return { slug: slug.split("/") };
	});
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const defaultMetadata = constructMetadata({
		title: `Documentation - Build Better Apps Faster | ${siteConfig.title}`,
		description: `Master app development with ${siteConfig.title}'s comprehensive documentation. Step-by-step guides, API references, and best practices for building production-ready applications.`,
		openGraph: {
			type: "article",
			siteName: `${siteConfig.title} Documentation`,
			locale: "en_US",
		},
	});

	try {
		const doc = await getDocFromParams(params);

		if (!doc) {
			return defaultMetadata;
		}

		return constructMetadata({
			title: `${doc.title} - ${siteConfig.title} Documentation`,
			description:
				doc.description ||
				`Learn how to implement ${siteConfig.title} features and best practices in your app development workflow. Detailed guides and examples included.`,
			openGraph: {
				type: "article",
				siteName: `${siteConfig.title} Documentation`,
				title: doc.title,
				description: doc.description,
				locale: "en_US",
			},
		});
	} catch (error) {
		return defaultMetadata;
	}
}

export default async function DocsPage({ params }: PageProps) {
	const doc = await getDocFromParams(params);

	if (!doc?.content) {
		notFound();
	}

	return (
		<article className="docs-content">
			<Suspense fallback={<SuspenseFallback />}>
				<MDXRemote source={doc.content} components={useMDXComponents({})} />
			</Suspense>
		</article>
	);
}

export const dynamicParams = false;
