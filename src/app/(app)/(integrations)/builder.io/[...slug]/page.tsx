// Example file structure, app/[...page]/page.tsx
// You could alternatively use src/app/[...page]/page.tsx
import type { Metadata } from "next";
import { builder } from "@builder.io/sdk";
import { constructMetadata } from "@/config/metadata";
import { env } from "@/env";
import { RenderBuilderContent } from "@/lib/builder-io/builder-io";
import "@/styles/builder-io.css";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = constructMetadata({
	title: "Builder.io Page",
	description: "Dynamic content powered by Builder.io visual editor.",
});

// Revalidate this page every 60 seconds
export const revalidate = 60;

interface PageProps {
	params: Promise<{
		slug: string[];
	}>;
}

if (env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED && env.NEXT_PUBLIC_BUILDER_API_KEY) {
	builder.init(env.NEXT_PUBLIC_BUILDER_API_KEY);
}

function Loading() {
	return <h2>🌀 Loading...</h2>;
}

export default async function Page(props: PageProps) {
	if (!builder || !env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED || !env.NEXT_PUBLIC_BUILDER_API_KEY) {
		return notFound();
	}

	const model = "page";
	const content = await builder
		// Get the page content from Builder with the specified options
		.get("page", {
			userAttributes: {
				// Use the page path specified in the URL to fetch the content
				urlPath: `/${(await props?.params)?.slug?.join("/")}`,
			},
			// Set prerender to false to return JSON instead of HTML
			prerender: false,
		})
		// Convert the result to a promise
		.toPromise();

	return (
		<>
			<div className="mx-auto w-full py-header">
				{/* Render the Builder page */}
				<Suspense fallback={<Loading />}>
					<RenderBuilderContent content={content} model={model} />
				</Suspense>
			</div>
		</>
	);
}
