/**
 * @fileoverview Parses a Keep a Changelog formatted CHANGELOG.md into changelog entries.
 * @module lib/changelog-markdown
 *
 * This is the source that lets any ShipKit site publish a web changelog straight from
 * the CHANGELOG.md that already lives in its repo, with no per-entry markdown to maintain.
 *
 * Format reference: https://keepachangelog.com/en/1.1.0/
 *
 * Pure string in, entries out. No filesystem or network access, so it stays testable.
 */

import type { ChangelogEntry } from "@/lib/changelog-types";

/**
 * Matches a release heading and pulls out the version, the release date, and a YANKED marker.
 *
 * Handles the shapes that appear in the wild:
 *   ## [1.2.3] - 2026-09-22
 *   ## [Unreleased]
 *   ## 1.2.3 - 2026-09-22
 *   ## [0.0.5] - 2014-12-13 [YANKED]
 *   ## [0.4.1.2] - 2025-06-29      (not every project is strict semver)
 *
 * The separator class accepts a hyphen, an en dash or an em dash, because hand-edited
 * files use all three. Those two characters appear here only as regex input to match,
 * never as prose.
 */
const RELEASE_HEADING =
  /^##\s+(?:\[([^\]]+)\]|([^\s[]+))\s*(?:[-–—]\s*(\d{4}-\d{2}-\d{2}))?\s*(\[YANKED\])?\s*$/i;

/** Matches a `### Added` style category heading. */
const CATEGORY_HEADING = /^###\s+(.+?)\s*$/;

/** Matches a link reference definition, e.g. `[1.2.3]: https://github.com/...`. */
const LINK_DEFINITION = /^\[[^\]]+\]:\s*\S+/;

/** Matches a top level bullet. Nested bullets are body text, not separate changes. */
const TOP_LEVEL_BULLET = /^[-*+]\s+\S/;

/**
 * How Keep a Changelog categories read in a one line summary.
 * Anything unrecognised falls back to a generic change count.
 */
const CATEGORY_SUMMARY: Record<string, { singular: string; plural: string }> = {
  added: { singular: "new feature", plural: "new features" },
  changed: { singular: "change", plural: "changes" },
  deprecated: { singular: "deprecation", plural: "deprecations" },
  removed: { singular: "removal", plural: "removals" },
  fixed: { singular: "bug fix", plural: "bug fixes" },
  security: { singular: "security fix", plural: "security fixes" },
};

/** Order used when building the description, so summaries read consistently. */
const SUMMARY_ORDER = ["added", "changed", "fixed", "removed", "deprecated", "security"];

interface RawSection {
  label: string;
  date: string;
  yanked: boolean;
  lines: string[];
}

/**
 * Splits the file into release sections, dropping the preamble and any trailing
 * link reference definitions.
 */
function splitSections(markdown: string): RawSection[] {
  const sections: RawSection[] = [];
  let current: RawSection | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = RELEASE_HEADING.exec(line);

    if (heading) {
      if (current) sections.push(current);
      current = {
        label: (heading[1] ?? heading[2] ?? "").trim(),
        date: heading[3] ?? "",
        yanked: Boolean(heading[4]),
        lines: [],
      };
      continue;
    }

    // Everything before the first release heading is the file's preamble.
    if (!current) continue;

    // Link definitions live at the foot of the file and would otherwise be
    // swallowed into the oldest release's body.
    if (LINK_DEFINITION.test(line)) continue;

    current.lines.push(line);
  }

  if (current) sections.push(current);
  return sections.filter((section) => section.label.length > 0);
}

/** Counts top level bullets under each `###` category heading. */
function countByCategory(lines: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  let category: string | null = null;

  for (const line of lines) {
    const heading = CATEGORY_HEADING.exec(line);
    if (heading?.[1]) {
      category = heading[1];
      if (!counts.has(category)) counts.set(category, 0);
      continue;
    }
    if (category && TOP_LEVEL_BULLET.test(line)) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  return counts;
}

/**
 * Builds the one line summary shown on the changelog index,
 * e.g. "3 new features, 2 bug fixes".
 */
function buildDescription(counts: Map<string, number>, totalChanges: number): string {
  const parts: string[] = [];

  for (const key of SUMMARY_ORDER) {
    const entry = [...counts.entries()].find(([label]) => label.toLowerCase() === key);
    const count = entry?.[1] ?? 0;
    if (count === 0) continue;
    const words = CATEGORY_SUMMARY[key];
    if (!words) continue;
    parts.push(`${count} ${count === 1 ? words.singular : words.plural}`);
  }

  if (parts.length > 0) return parts.join(", ");
  if (totalChanges > 0) return `${totalChanges} change${totalChanges === 1 ? "" : "s"}`;
  return "Maintenance and internal improvements.";
}

/** Turns a version label into a URL safe slug, matching the GitHub source's scheme. */
function toSlug(label: string): string {
  return (
    label
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "release"
  );
}

/**
 * Parses a Keep a Changelog file into entries, newest first.
 *
 * Entry order follows the file rather than the parsed dates. Keep a Changelog already
 * requires newest first, and trusting the file keeps an undated `Unreleased` section at
 * the top where it belongs instead of sorting it to the bottom.
 */
export function parseChangelogMarkdown(markdown: string): ChangelogEntry[] {
  if (!markdown.trim()) return [];

  return splitSections(markdown).map((section) => {
    const counts = countByCategory(section.lines);
    const totalChanges = [...counts.values()].reduce((sum, n) => sum + n, 0);
    const isUnreleased = section.label.toLowerCase() === "unreleased";

    const content = section.lines.join("\n").trim();
    const categories = [...counts.keys()];

    const description = section.yanked
      ? `Withdrawn release. ${buildDescription(counts, totalChanges)}`
      : buildDescription(counts, totalChanges);

    return {
      // "Release 1.2.3" mirrors the GitHub commit source so both look the same on the page.
      title: isUnreleased ? "Unreleased" : `Release ${section.label}`,
      slug: toSlug(section.label),
      content,
      description,
      publishedAt: section.date,
      badge: section.yanked ? `${section.label} (yanked)` : section.label,
      categories,
      // A CHANGELOG file says nothing about commits. Report the number of documented
      // changes instead, and let the UI label it accordingly.
      commitCount: 0,
      changeCount: totalChanges,
    } satisfies ChangelogEntry;
  });
}
