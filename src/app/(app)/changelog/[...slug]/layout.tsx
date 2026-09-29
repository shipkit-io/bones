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
 * here settles the HTTP status before Next streams the shell. The page below
 * keeps its skeleton.
 */
export default async function ChangelogEntryLayout({ children, params }: Props) {
  const { slug } = await params;
  const entry = await getChangelogEntry(slug.join("/"));
  if (!entry) notFound();
  return children;
}
