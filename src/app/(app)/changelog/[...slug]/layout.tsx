import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getChangelogEntry } from "@/lib/changelog";

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
 */
export default async function ChangelogEntryLayout({ children, params }: Props) {
	const { slug } = await params;
	const entry = await getChangelogEntry(slug.join("/"));
	if (!entry) notFound();
	return children;
}
