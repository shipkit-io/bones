/**
 * Generates content manifests from markdown files in src/content/.
 * Run before `next build` so content is statically imported into the bundle,
 * avoiding runtime fs.readdir which Turbopack doesn't trace.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, "src/lib/generated");
const CONTENT_DIR = path.join(ROOT, "src/content");

function scanDir(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => extensions.some((ext) => f.endsWith(ext)))
    .sort();
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: raw.trim() };

  const frontmatterBlock = match[1];
  const content = match[2].trim();
  const frontmatter = {};

  for (const line of frontmatterBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val.startsWith("[") && val.endsWith("]")) {
      try {
        val = JSON.parse(val.replace(/'/g, '"'));
      } catch {
        /* keep as string */
      }
    }
    if (val === "true") val = true;
    if (val === "false") val = false;
    if (/^\d+$/.test(val)) val = Number(val);
    frontmatter[key] = val;
  }
  return { frontmatter, content };
}

function readEntries(dir, extensions) {
  const files = scanDir(dir, extensions);
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(dir, filename), "utf-8");
    const { frontmatter, content } = parseFrontmatter(raw);
    return { filename, frontmatter, content };
  });
}

fs.mkdirSync(GENERATED_DIR, { recursive: true });

// Changelog
const changelogEntries = readEntries(
  path.join(CONTENT_DIR, "changelog"),
  [".md", ".mdx"]
);

// Blog
const blogEntries = readEntries(path.join(CONTENT_DIR, "blog"), [
  ".md",
  ".mdx",
]);

const changelogTs = `// AUTO-GENERATED — do not edit. Run: node scripts/prebuild-content.mjs
export interface ManifestEntry {
  filename: string;
  frontmatter: Record<string, unknown>;
  content: string;
}
export const changelogManifest: ManifestEntry[] = ${JSON.stringify(changelogEntries, null, 2)};
`;

const blogTs = `// AUTO-GENERATED — do not edit. Run: node scripts/prebuild-content.mjs
export interface ManifestEntry {
  filename: string;
  frontmatter: Record<string, unknown>;
  content: string;
}
export const blogManifest: ManifestEntry[] = ${JSON.stringify(blogEntries, null, 2)};
`;

fs.writeFileSync(path.join(GENERATED_DIR, "changelog-manifest.ts"), changelogTs);
fs.writeFileSync(path.join(GENERATED_DIR, "blog-manifest.ts"), blogTs);

// Clean up the JSON files if they exist from a previous approach
for (const f of ["changelog-manifest.json", "blog-manifest.json"]) {
  const p = path.join(GENERATED_DIR, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

console.error(
  `[prebuild-content] Generated: ${changelogEntries.length} changelog, ${blogEntries.length} blog entries`
);
