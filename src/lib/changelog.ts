import fs from "node:fs/promises";
import path from "node:path";
import { parseChangelogMarkdown } from "@/lib/changelog-markdown";
import type { ChangelogEntry } from "@/lib/changelog-types";
import { changelogManifest } from "@/lib/generated/changelog-manifest";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type { ChangelogEntry } from "@/lib/changelog-types";

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string; name: string };
  };
}

interface GitHubTag {
  name: string;
  commit: { sha: string };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const REPO_OWNER = process.env.GITHUB_REPO_OWNER ?? "lacymorrow";
const REPO_NAME = process.env.GITHUB_REPO_NAME ?? "shipkit";
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const COMMITS_PER_PAGE = 100;
const MAX_PAGES = 5; // 500 commits max

/**
 * Path to the repo's Keep a Changelog file, looked for on disk first and then in the
 * configured GitHub repo. Set CHANGELOG_PATH to "" to skip this source entirely.
 */
const CHANGELOG_PATH = process.env.CHANGELOG_PATH ?? "CHANGELOG.md";

// ---------------------------------------------------------------------------
// GitHub fetcher (works unauthenticated for public repos, uses token if set)
// ---------------------------------------------------------------------------
async function ghFetch<T>(endpoint: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  const token = process.env.GITHUB_TOKEN ?? process.env.GITHUB_ACCESS_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${GITHUB_API}${endpoint}`, { headers });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${endpoint} - ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Fetch all commits (paginated)
// ---------------------------------------------------------------------------
async function fetchCommits(): Promise<GitHubCommit[]> {
  const all: GitHubCommit[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await ghFetch<GitHubCommit[]>(
      `/commits?per_page=${COMMITS_PER_PAGE}&page=${page}`
    );
    all.push(...batch);
    if (batch.length < COMMITS_PER_PAGE) break;
  }
  return all;
}

// ---------------------------------------------------------------------------
// Fetch tags and build sha->tag map
// ---------------------------------------------------------------------------
async function fetchTagMap(): Promise<Map<string, string>> {
  const tags = await ghFetch<GitHubTag[]>("/tags?per_page=100");
  const map = new Map<string, string>();
  for (const tag of tags) {
    map.set(tag.commit.sha, tag.name);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Commit message parsing
// ---------------------------------------------------------------------------
const NOISE = [
  /^auto commit$/i,
  /^merge /i,
  /^Merge pull request/,
  /^Merge branch/,
  /^initial commit$/i,
  /^wip$/i,
  /^\.$/,
];

function isNoise(msg: string): boolean {
  return NOISE.some((re) => re.test(msg));
}

interface ParsedCommit {
  type: string;
  scope: string | null;
  subject: string;
  breaking: boolean;
}

function parseConventional(message: string): ParsedCommit | null {
  const match = /^(\w+)(?:\(([^)]+)\))?(!?):\s*(.+)/.exec(message);
  if (!match) return null;
  // Regex above guarantees groups 1 and 4 exist on a successful match.
  const type = match[1];
  const subject = match[4];
  if (!type || !subject) return null;
  return {
    type: type.toLowerCase(),
    scope: match[2] ?? null,
    subject,
    breaking: match[3] === "!",
  };
}

const TYPE_LABELS: Record<string, string> = {
  feat: "New Features",
  fix: "Bug Fixes",
  perf: "Performance",
  refactor: "Improvements",
  docs: "Documentation",
  style: "Styling",
  chore: "Maintenance",
  ci: "CI/CD",
  test: "Testing",
  build: "Build",
};

// ---------------------------------------------------------------------------
// Grouping: by tag or by week
// ---------------------------------------------------------------------------

interface CommitGroup {
  label: string;
  slug: string;
  date: string; // ISO date of the most recent commit
  commits: GitHubCommit[];
  isRelease: boolean;
}

function groupCommits(commits: GitHubCommit[], tagMap: Map<string, string>): CommitGroup[] {
  const groups: CommitGroup[] = [];
  let currentGroup: GitHubCommit[] = [];
  let currentTag: string | null = null;

  // Walk commits newest-first, split on tags
  for (const commit of commits) {
    const tag = tagMap.get(commit.sha);
    if (tag && currentGroup.length > 0) {
      // Close previous group as "Recent Updates"
      const newestDate = currentGroup[0]?.commit.author.date ?? new Date().toISOString();
      const groupLabel = currentTag ?? "Recent Updates";
      const groupSlug = currentTag
        ? currentTag.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase()
        : `updates-${newestDate.slice(0, 10)}`;

      groups.push({
        label: groupLabel,
        slug: groupSlug,
        date: newestDate,
        commits: currentGroup,
        isRelease: !!currentTag,
      });
      currentGroup = [];
    }
    if (tag) currentTag = tag;
    currentGroup.push(commit);
  }

  // Final group
  if (currentGroup.length > 0) {
    const newestDate = currentGroup[0]?.commit.author.date ?? new Date().toISOString();
    const groupLabel = currentTag ?? "Recent Updates";
    const groupSlug = currentTag
      ? currentTag.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase()
      : `updates-${newestDate.slice(0, 10)}`;

    groups.push({
      label: groupLabel,
      slug: groupSlug,
      date: newestDate,
      commits: currentGroup,
      isRelease: !!currentTag,
    });
  }

  // If no tags at all, keep everything as one "Recent Updates" group
  if (tagMap.size === 0 && commits.length > 0) {
    const newestDate = commits[0]?.commit.author.date ?? new Date().toISOString();
    return [
      {
        label: "Recent Updates",
        slug: `updates-${newestDate.slice(0, 10)}`,
        date: newestDate,
        commits,
        isRelease: false,
      },
    ];
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Render a group into a changelog entry
// ---------------------------------------------------------------------------
function renderEntry(group: CommitGroup): ChangelogEntry {
  const meaningful = group.commits.filter((c) => !isNoise(c.commit.message.split("\n")[0]!));

  // Bucket by conventional commit type
  const buckets = new Map<string, string[]>();
  const uncategorized: string[] = [];

  for (const c of meaningful) {
    const firstLine = c.commit.message.split("\n")[0]!;
    const parsed = parseConventional(firstLine);
    if (parsed) {
      const label = TYPE_LABELS[parsed.type] ?? "Other";
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label)?.push(parsed.subject);
    } else {
      uncategorized.push(firstLine);
    }
  }

  // Build markdown
  const sections: string[] = [];
  const sectionOrder = Object.values(TYPE_LABELS);
  for (const label of sectionOrder) {
    const items = buckets.get(label);
    if (!items?.length) continue;
    sections.push(`## ${label}\n\n${items.map((s) => `- ${s}`).join("\n")}`);
  }
  if (uncategorized.length) {
    sections.push(`## Changes\n\n${uncategorized.map((s) => `- ${s}`).join("\n")}`);
  }

  const content = sections.join("\n\n") || "Maintenance and internal improvements.";

  // Count features and fixes for description
  const featureCount = buckets.get("New Features")?.length ?? 0;
  const fixCount = buckets.get("Bug Fixes")?.length ?? 0;
  const parts: string[] = [];
  if (featureCount) parts.push(`${featureCount} new feature${featureCount > 1 ? "s" : ""}`);
  if (fixCount) parts.push(`${fixCount} bug fix${fixCount > 1 ? "es" : ""}`);
  if (!parts.length) parts.push(`${meaningful.length} update${meaningful.length !== 1 ? "s" : ""}`);
  const description = parts.join(", ");

  // Badge
  const badge = group.isRelease ? group.label : undefined;

  // Categories from commit types
  const categories = Array.from(buckets.keys());

  return {
    title: group.isRelease ? `Release ${group.label}` : group.label,
    slug: group.slug,
    content,
    description,
    publishedAt: group.date.slice(0, 10),
    badge,
    categories,
    commitCount: group.commits.length,
  };
}

// ---------------------------------------------------------------------------
// Markdown file-based changelog (src/content/changelog/*.md)
// Uses the build-time manifest (generated by scripts/prebuild-content.mjs)
// with a runtime fs.readdir fallback for local development.
// ---------------------------------------------------------------------------
const CHANGELOG_DIR = path.join(process.cwd(), "src/content/changelog");

function manifestToEntries(manifest: typeof changelogManifest): ChangelogEntry[] {
  return manifest.map((entry) => {
    const slug = (entry.frontmatter.slug as string) ?? entry.filename.replace(/\.mdx?$/, "");
    return {
      title: (entry.frontmatter.title as string) ?? slug,
      slug,
      content: entry.content,
      description: (entry.frontmatter.description as string) ?? "",
      publishedAt: (entry.frontmatter.publishedAt as string) ?? "",
      badge: entry.frontmatter.badge as string | undefined,
      categories: (entry.frontmatter.categories as string[]) ?? [],
      commitCount: (entry.frontmatter.commitCount as number) ?? 0,
    } satisfies ChangelogEntry;
  });
}

async function getMarkdownEntries(): Promise<ChangelogEntry[]> {
  if (changelogManifest.length > 0) {
    const entries = manifestToEntries(changelogManifest);
    return entries.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  let filenames: string[];
  try {
    filenames = await fs.readdir(CHANGELOG_DIR);
  } catch {
    return [];
  }

  const mdFiles = filenames.filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  if (mdFiles.length === 0) return [];

  const { default: matter } = await import("gray-matter");
  const entries = await Promise.all(
    mdFiles.map(async (filename) => {
      const filePath = path.join(CHANGELOG_DIR, filename);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const { data, content } = matter(fileContent);

      const slug = data.slug ?? filename.replace(/\.mdx?$/, "");

      return {
        title: data.title ?? slug,
        slug,
        content: content.trim(),
        description: data.description ?? "",
        publishedAt: data.publishedAt ?? "",
        badge: data.badge,
        categories: data.categories ?? [],
        commitCount: data.commitCount ?? 0,
      } satisfies ChangelogEntry;
    })
  );

  return entries.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// ---------------------------------------------------------------------------
// Repo CHANGELOG.md (Keep a Changelog format)
//
// Read from disk when the site ships its own changelog, otherwise fetched from the
// configured GitHub repo. This is what lets a downstream ShipKit site publish the
// changelog of whatever repo it is the website for.
// ---------------------------------------------------------------------------
interface GitHubContentFile {
  content?: string;
  encoding?: string;
}

async function readLocalChangelogFile(): Promise<string | null> {
  try {
    return await fs.readFile(path.join(process.cwd(), CHANGELOG_PATH), "utf-8");
  } catch {
    return null;
  }
}

async function fetchRemoteChangelogFile(): Promise<string | null> {
  try {
    const file = await ghFetch<GitHubContentFile>(`/contents/${encodeURI(CHANGELOG_PATH)}`);
    if (!file.content || file.encoding !== "base64") return null;
    return Buffer.from(file.content, "base64").toString("utf-8");
  } catch {
    // A repo without a CHANGELOG.md is the normal case, not an error worth surfacing.
    return null;
  }
}

async function getRepoChangelogEntries(): Promise<ChangelogEntry[]> {
  if (!CHANGELOG_PATH) return [];

  const source = (await readLocalChangelogFile()) ?? (await fetchRemoteChangelogFile());
  if (!source) return [];

  return parseChangelogMarkdown(source);
}

// ---------------------------------------------------------------------------
// GitHub API-based changelog (fallback when no .md files exist)
// ---------------------------------------------------------------------------
async function getGitHubEntries(): Promise<ChangelogEntry[]> {
  const [commits, tagMap] = await Promise.all([fetchCommits(), fetchTagMap()]);
  const groups = groupCommits(commits, tagMap);
  const entries = groups.map(renderEntry);
  return entries.filter((e) => e.commitCount > 0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Loads changelog entries from the first source that has something to say:
 *
 * 1. Curated per-entry markdown in `src/content/changelog/`, for sites that write
 *    their own release posts.
 * 2. The repo's `CHANGELOG.md`, on disk or from GitHub. One canonical changelog,
 *    written once, rendered here.
 * 3. Generated from the repo's commits and tags, so a site with neither still
 *    gets a changelog out of the box.
 */
export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  try {
    const mdEntries = await getMarkdownEntries();
    if (mdEntries.length > 0) return mdEntries;

    const repoEntries = await getRepoChangelogEntries();
    if (repoEntries.length > 0) return repoEntries;

    return await getGitHubEntries();
  } catch (err) {
    console.error("[changelog] Failed to load changelog:", err);
    return [];
  }
}

export async function getChangelogEntry(slug: string): Promise<ChangelogEntry | null> {
  const entries = await getChangelogEntries();
  return entries.find((e) => e.slug === slug) ?? null;
}
