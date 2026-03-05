import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { cache } from "react";
import { z } from "zod";

export const DocSchema = z.object({
	title: z.string().min(1).max(500), // Increased from 200 to 500
	description: z.string().max(1000).optional(), // Made optional, increased from 500 to 1000
	slug: z.string().min(1).max(200), // Increased from 100 to 200
	content: z.string(),
	keywords: z.array(z.string().max(100)).optional(), // Increased from 50 to 100
	author: z.string().max(200).optional(), // Increased from 100 to 200
	publishedAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
	lastModified: z.date().optional(),
	section: z.string().max(100).default("core"), // Changed from enum to flexible string with default
	seo: z
		.object({
			canonicalUrl: z.string().url().optional(),
			focusKeywords: z.array(z.string().max(100)).optional(), // Increased from 50 to 100
			metaRobots: z.array(z.string()).optional(),
		})
		.optional(),
});

export type Doc = z.infer<typeof DocSchema>;

export interface NavItem {
	title: string;
	href: string;
	external?: boolean;
	description?: string;
}

export interface NavSection {
	title: string;
	items: NavItem[];
}

/*
 * Sanitize and validate file path to prevent directory traversal attacks
 */
function sanitizeFilePath(inputPath: string): string {
	// Remove any path traversal attempts
	const sanitized = inputPath
		.replace(/\.\./g, "") // Remove ..
		.replace(/\/+/g, "/") // Normalize multiple slashes
		.replace(/^\/+/, "") // Remove leading slashes
		.replace(/\/+$/, ""); // Remove trailing slashes

	// Validate that the path only contains safe characters
	if (!/^[\w\-/.]*$/.test(sanitized)) {
		throw new Error("Invalid file path characters");
	}

	return sanitized;
}

/*
 * Validate slug format to prevent injection attacks
 */
function validateSlug(slug: string): string {
	const sanitized = slug.trim();

	// Basic validation
	if (sanitized.length > 100) {
		throw new Error("Slug too long");
	}

	// Allow only safe characters
	if (!/^[\w\-/]*$/.test(sanitized)) {
		throw new Error("Invalid slug format");
	}

	return sanitized;
}

/*
 * Extract title from H1 tag in markdown content
 */
function extractTitleFromH1(content: string): string | null {
	// Remove code blocks to avoid matching # inside them
	const contentWithoutCodeBlocks = content
		// Remove fenced code blocks (```...```)
		.replace(/```[\s\S]*?```/g, "")
		// Remove inline code blocks (`...`)
		.replace(/`[^`]+`/g, "");

	// Look for the first H1 tag in the cleaned content
	const h1Match = /^#\s+(.+)$/m.exec(contentWithoutCodeBlocks);
	if (h1Match && h1Match[1]) {
		// Clean up the title (remove extra whitespace, emoji, etc.)
		return h1Match[1]
			.trim()
			.replace(/^\W+|\W+$/g, "")
			.slice(0, 200);
	}
	return null;
}

/*
 * Read and parse MDX file with security validations
 */
async function readMdxFile(filePath: string, slug: string) {
	try {
		// Check file size limit (5MB)
		const stats = fs.statSync(filePath);
		if (stats.size > 5 * 1024 * 1024) {
			console.error(`File too large: ${filePath}`);
			return null;
		}

		const content = fs.readFileSync(filePath, "utf-8");

		// Basic content validation
		if (content.length > 1024 * 1024) {
			// 1MB content limit
			console.error(`Content too large: ${filePath}`);
			return null;
		}

		const { data: frontmatter, content: mdContent } = matter(content);

		// Try to get title from frontmatter first, then from H1 tag
		let title = frontmatter?.title;
		if (!title || typeof title !== "string") {
			title = extractTitleFromH1(mdContent);
			if (!title) {
				console.warn(`No valid title found in frontmatter or H1 for doc: ${slug}`);
				return null;
			}
		}

		// Sanitize frontmatter with extracted or existing title
		const sanitizedFrontmatter = {
			...frontmatter,
			title: title.slice(0, 500), // Use extracted or frontmatter title
			description: frontmatter.description?.slice(0, 1000), // Optional and increased limit
			updatedAt: frontmatter.updatedAt,
			section: frontmatter.section || "core", // Provide default if missing
		};

		// For docs migration: return raw content for MDXRemote processing
		return {
			...sanitizedFrontmatter,
			slug,
			content: mdContent, // Return raw MDX content instead of processed HTML
			lastModified: sanitizedFrontmatter?.updatedAt
				? new Date(sanitizedFrontmatter.updatedAt)
				: new Date(),
			section: sanitizedFrontmatter.section ?? "core",
		};
	} catch (error) {
		console.error(`Error reading MDX file: ${filePath}`, error);
		return null;
	}
}

/*
 * Dynamic import helper for docs from root /docs directory
 */
async function importDocFromRootDocs(slug: string) {
	try {
		const sanitizedSlug = validateSlug(slug);
		const docsPath = path.join(process.cwd(), "docs");

		// Ensure the docs path exists and is accessible
		if (!fs.existsSync(docsPath)) {
			console.warn("Docs directory does not exist:", docsPath);
			return null;
		}

		// Try different file patterns - prefer .mdx over .md
		const patterns = [
			path.join(docsPath, `${sanitizedSlug}.mdx`),
			path.join(docsPath, `${sanitizedSlug}.md`),
			path.join(docsPath, sanitizedSlug, "index.mdx"),
			path.join(docsPath, sanitizedSlug, "index.md"),
		];

		for (const filePath of patterns) {
			// Validate that the resolved path is within the docs directory
			const resolvedPath = path.resolve(filePath);
			const resolvedDocsPath = path.resolve(docsPath);
			if (!resolvedPath.startsWith(resolvedDocsPath)) {
				console.warn("Attempted directory traversal:", slug);
				continue;
			}

			if (fs.existsSync(filePath)) {
				return await readMdxFile(filePath, sanitizedSlug);
			}
		}

		return null;
	} catch (error) {
		console.error(`Error importing doc from root docs: ${slug}`, error);
		return null;
	}
}

export const getDocBySlug = cache(async (slug = "index") => {
	try {
		// Import from root /docs directory
		const doc = await importDocFromRootDocs(slug);
		return doc;
	} catch (error) {
		console.error(`Error reading doc: ${slug}`, error);
		return null;
	}
});

export async function getAllDocs(): Promise<Doc[]> {
	try {
		// Dynamically discover all docs from the filesystem
		const slugs = await getAllDocSlugsFromFileSystem();
		// Use environment variable for limit, default to 100
		const docsLimit = process.env.DOCS_PROCESSING_LIMIT
			? Number.parseInt(process.env.DOCS_PROCESSING_LIMIT, 10)
			: 100;
		const docs = await Promise.all(
			slugs.slice(0, docsLimit).map(async (slug) => {
				// Limit to prevent DoS
				try {
					return await getDocBySlug(slug);
				} catch (error) {
					console.error(`Error loading doc ${slug}:`, error);
					return null;
				}
			})
		);

		return docs.filter((doc): doc is NonNullable<typeof doc> => doc !== null);
	} catch (error) {
		console.error("Error loading docs:", error);
		return [];
	}
}

function processDirectory(dir: string): NavSection[] {
	try {
		const sanitizedDir = sanitizeFilePath(dir);
		const sections: NavSection[] = [];
		const rootPath = path.join(process.cwd(), "docs");

		// Validate that the directory path is safe
		const fullDirPath = path.join(rootPath, sanitizedDir);
		const resolvedPath = path.resolve(fullDirPath);
		const resolvedRootPath = path.resolve(rootPath);

		if (!resolvedPath.startsWith(resolvedRootPath)) {
			console.warn("Attempted directory traversal in processDirectory:", dir);
			return [];
		}

		if (!fs.existsSync(fullDirPath)) {
			return [];
		}

		const entries = fs.readdirSync(fullDirPath, { withFileTypes: true });

		// Process directories first (limit depth to prevent DoS)
		const maxDepth = 3;
		const currentDepth = sanitizedDir.split("/").filter(Boolean).length;

		if (currentDepth < maxDepth) {
			for (const entry of entries.filter((entry) => entry.isDirectory()).slice(0, 20)) {
				// Limit directories
				const sectionPath = path.join(sanitizedDir, entry.name);
				const items: NavItem[] = [];

				try {
					const files = fs.readdirSync(path.join(rootPath, sectionPath));
					for (const file of files.slice(0, 50)) {
						// Limit files per directory
						if (file.endsWith(".mdx") || file.endsWith(".md")) {
							const filePath = path.join(rootPath, sectionPath, file);

							// Validate file path
							const resolvedFilePath = path.resolve(filePath);
							if (!resolvedFilePath.startsWith(resolvedRootPath)) {
								continue;
							}

							const content = fs.readFileSync(filePath, "utf-8");
							const { data, content: mdContent } = matter(content);
							const fileName = file.replace(/\.(mdx|md)$/, "");

							// Check if doc has a valid title (frontmatter or H1)
							let title = data.title;
							if (!title) {
								title = extractTitleFromH1(mdContent);
							}

							// Only include docs with valid titles in navigation
							if (title) {
								items.push({
									title: title,
									href: `/docs/${sectionPath}/${fileName}`,
									description: data.description,
								});
							}
						}
					}
				} catch (error) {
					console.error(`Error reading directory ${sectionPath}:`, error);
					continue;
				}

				if (items.length > 0) {
					sections.push({
						title: entry.name
							.split("-")
							.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
							.join(" "),
						items: items.sort((a, b) => a.title.localeCompare(b.title)),
					});
				}
			}
		}

		// Process root MDX/MD files
		const rootItems: NavItem[] = [];
		for (const entry of entries
			.filter(
				(entry) => entry.isFile() && (entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))
			)
			.slice(0, 50)) {
			try {
				const filePath = path.join(rootPath, sanitizedDir, entry.name);
				const resolvedFilePath = path.resolve(filePath);
				if (!resolvedFilePath.startsWith(resolvedRootPath)) {
					continue;
				}

				const content = fs.readFileSync(filePath, "utf-8");
				const { data, content: mdContent } = matter(content);
				const fileName = entry.name.replace(/\.(mdx|md)$/, "");

				// Skip index files as they're handled separately
				if (fileName !== "index") {
					// Check if doc has a valid title (frontmatter or H1)
					let title = data.title;
					if (!title) {
						title = extractTitleFromH1(mdContent);
					}

					// Only include docs with valid titles in navigation
					if (title) {
						rootItems.push({
							title: title,
							href: `/docs/${fileName}`,
							description: data.description,
						});
					}
				}
			} catch (error) {
				console.error(`Error reading file ${entry.name}:`, error);
			}
		}

		if (rootItems.length > 0) {
			sections.unshift({
				title: "Core",
				items: rootItems.sort((a, b) => a.title.localeCompare(b.title)),
			});
		}

		return sections;
	} catch (error) {
		console.error("Error processing directory:", error);
		return [];
	}
}

export async function getAllDocSlugsFromFileSystem(): Promise<string[]> {
	const slugs: string[] = [];
	const rootPath = path.join(process.cwd(), "docs");

	if (!fs.existsSync(rootPath)) {
		return slugs;
	}

	function collectSlugs(dir: string, prefix = "") {
		try {
			const entries = fs.readdirSync(dir, { withFileTypes: true });
			const processedInThisDir = new Set<string>(); // Track processed files in this directory

			for (const entry of entries.slice(0, 100)) {
				// Limit to prevent DoS
				const fullPath = path.join(dir, entry.name);
				const resolvedPath = path.resolve(fullPath);
				const resolvedRootPath = path.resolve(rootPath);

				// Security check
				if (!resolvedPath.startsWith(resolvedRootPath)) {
					continue;
				}

				if (entry.isDirectory()) {
					collectSlugs(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
				} else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
					const fileName = entry.name.replace(/\.(mdx|md)$/, "");
					const slug = prefix ? `${prefix}/${fileName}` : fileName;

					// Only add if we haven't already processed this slug from this directory
					if (!processedInThisDir.has(fileName)) {
						slugs.push(slug);
						processedInThisDir.add(fileName);
					}
				}
			}
		} catch (error) {
			console.error(`Error collecting slugs from ${dir}:`, error);
		}
	}

	collectSlugs(rootPath);

	// Remove duplicates and limit
	const uniqueSlugs = Array.from(new Set(slugs));
	return uniqueSlugs.slice(0, 100); // Final limit
}

export const getDocNavigation = cache(() => {
	return processDirectory("");
});

export const getDocsNavigation = getDocNavigation;

/*
 * Get doc from Next.js params object
 */
export async function getDocFromParams(paramsPromise: Promise<{ slug?: string[] }>) {
	const params = await paramsPromise;
	const slug = params.slug?.join("/") || "index";
	return await getDocBySlug(slug);
}

/*
 * Search docs for keywords (limit results for performance)
 */
export async function searchDocs(query: string): Promise<Doc[]> {
	try {
		if (!query.trim() || query.length > 100) {
			return [];
		}

		const allDocs = await getAllDocs();
		const searchTerm = query.toLowerCase().trim();

		const results = allDocs
			.filter((doc) => {
				const titleMatch = doc.title.toLowerCase().includes(searchTerm);
				const contentMatch = doc.content.toLowerCase().includes(searchTerm);
				const descriptionMatch = doc.description?.toLowerCase().includes(searchTerm) ?? false;

				return titleMatch || contentMatch || descriptionMatch;
			})
			.slice(0, 20); // Limit search results

		return results;
	} catch (error) {
		console.error("Error searching docs:", error);
		return [];
	}
}
