import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogPostListSkeleton } from "@/components/modules/blog/skeleton";
import { constructMetadata, routeMetadata } from "@/config/metadata";
import { ChangelogEntries } from "./_components/changelog-entries";

export const revalidate = 3600;

export const metadata: Metadata = constructMetadata(routeMetadata.changelog);

export default function ChangelogPage() {
	return (
		<div className="w-full max-w-3xl mx-auto">
			<header className="mb-12">
				<h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
				<p className="mt-2 text-lg text-muted-foreground">New updates, features, and fixes.</p>
			</header>

			{/* In-page Suspense keeps the skeleton without a segment loading.tsx,
			    which would also wrap [...slug] and break its 404 status. */}
			<Suspense fallback={<BlogPostListSkeleton count={5} />}>
				<ChangelogEntries />
			</Suspense>
		</div>
	);
}
