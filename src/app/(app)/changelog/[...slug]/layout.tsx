import { notFound, permanentRedirect } from "next/navigation";
import type { ReactNode } from "react";
import { getChangelogEntry, isLegacyUnreleasedSlug, UNRELEASED_SLUG } from "@/lib/changelog";

interface Props {
  children: ReactNode;
  params: Promise<{ slug: string[] }>;
}

/**
 * Existence check for /changelog/[...slug].
 *
 * A layout renders above its segment's loading.tsx boundary, so notFound()
 * here runs before Next streams the shell and the response gets a real 404.
 * The page below keeps its skeleton for slow renders. getChangelogEntry is
 * cached (unstable_cache), so the page's own lookup costs nothing extra.
 *
 * The untagged group used to be named after its newest commit
 * (`updates-YYYY-MM-DD`), so cached list pages, sitemaps and search results
 * still carry those slugs. They redirect to the stable slug instead of 404ing.
 */
export default async function ChangelogEntryLayout({ children, params }: Props) {
  const { slug } = await params;
  const key = slug.join("/");
  const entry = await getChangelogEntry(key);
  if (!entry) {
    if (isLegacyUnreleasedSlug(key)) permanentRedirect(`/changelog/${UNRELEASED_SLUG}`);
    notFound();
  }
  return children;
}
