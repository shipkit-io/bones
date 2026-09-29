import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogPostListSkeleton } from "@/components/modules/blog/skeleton";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { ChangelogEntries } from "./_components/changelog-entries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = constructMetadata({
  title: `Changelog | ${siteConfig.title}`,
  description: `See what's new in ${siteConfig.title}. Latest updates, features, and fixes.`,
});

export default function ChangelogPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
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
