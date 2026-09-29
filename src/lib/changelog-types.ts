/**
 * @fileoverview Shared changelog types.
 * @module lib/changelog-types
 *
 * Kept in its own module so the markdown parser and the loader can share the shape
 * without importing each other.
 */

export interface ChangelogEntry {
  title: string;
  slug: string;
  content: string;
  description: string;
  publishedAt: string;
  badge?: string;
  categories: string[];
  /** Commits behind this entry. Zero when the source is a written changelog rather than git. */
  commitCount: number;
  /** Documented changes behind this entry. Set when the source is a written changelog. */
  changeCount?: number;
}

/**
 * Describes how much is behind an entry, in the unit the source actually knows about.
 * Entries generated from git count commits; entries read from a CHANGELOG.md count
 * documented changes. Returns an empty string when there is nothing honest to show.
 */
export function describeEntrySize(entry: ChangelogEntry): string {
  const count = entry.commitCount > 0 ? entry.commitCount : (entry.changeCount ?? 0);
  if (count <= 0) return "";

  const noun = entry.commitCount > 0 ? "commit" : "change";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
