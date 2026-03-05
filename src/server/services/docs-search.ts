import { readdir, readFile } from "fs/promises";
import matter from "gray-matter";
import { join } from "path";

export interface DocSearchResult {
	title: string;
	content: string;
	url: string;
}

export class DocsSearchService {
	private static instance: DocsSearchService;
	private docsCache: Map<string, { content: string; metadata: any }> = new Map<
		string,
		{ content: string; metadata: any }
	>();
	private initialized = false;

	private constructor() {
		this.docsCache = new Map<string, { content: string; metadata: any }>();
		this.initialized = false;
	}

	public static getInstance(): DocsSearchService {
		if (!DocsSearchService.instance) {
			DocsSearchService.instance = new DocsSearchService();
		}
		return DocsSearchService.instance;
	}

	private async initialize() {
		if (this.initialized) return;

		// Load docs from root /docs directory
		const rootDocsDir = join(process.cwd(), "docs");
		await this.loadDocFiles(rootDocsDir, "");

		this.initialized = true;
	}

	private async loadDocFiles(dir: string, baseReplacePath = "") {
		try {
			const entries = await readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(dir, entry.name);

				if (entry.isDirectory()) {
					await this.loadDocFiles(fullPath, baseReplacePath);
				} else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
					const content = await readFile(fullPath, "utf-8");
					const { data, content: mdContent } = matter(content);

					let relativePath: string;
					if (baseReplacePath) {
						// Legacy path processing
						relativePath = fullPath
							.replace(process.cwd(), "")
							.replace(baseReplacePath, "")
							.replace(/\.(mdx?|md)$/, "")
							.replace(/^\/+/, "");
					} else {
						// Root docs path processing
						relativePath = fullPath
							.replace(join(process.cwd(), "docs"), "")
							.replace(/\.(mdx?|md)$/, "")
							.replace(/^\/+/, "");
					}

					// Avoid duplicates - prefer root docs over legacy
					if (!this.docsCache.has(relativePath)) {
						this.docsCache.set(relativePath, {
							content: mdContent,
							metadata: data,
						});
					}
				}
			}
		} catch (error) {
			console.warn(`Warning: Could not load docs from ${dir}:`, error);
		}
	}

	public async search(query: string, limit = 5): Promise<DocSearchResult[]> {
		await this.initialize();

		const results: DocSearchResult[] = [];
		const searchTerms = query.toLowerCase().split(" ");

		for (const [path, { content, metadata }] of this.docsCache.entries()) {
			const contentLower = content.toLowerCase();
			const titleLower = (metadata.title ?? "").toLowerCase();

			// Simple relevance scoring
			let score = 0;
			for (const term of searchTerms) {
				if (titleLower.includes(term)) score += 2;
				if (contentLower.includes(term)) score += 1;
			}

			if (score > 0) {
				results.push({
					title: metadata.title ?? path,
					content: this.extractRelevantSnippet(content, query),
					url: `/docs/${path}`,
				});
			}
		}

		// Sort by relevance and limit results
		return results
			.sort((a, b) => {
				const scoreA = searchTerms.reduce(
					(acc, term) =>
						acc +
						(a.title.toLowerCase().includes(term) ? 2 : 0) +
						(a.content.toLowerCase().includes(term) ? 1 : 0),
					0
				);
				const scoreB = searchTerms.reduce(
					(acc, term) =>
						acc +
						(b.title.toLowerCase().includes(term) ? 2 : 0) +
						(b.content.toLowerCase().includes(term) ? 1 : 0),
					0
				);
				return scoreB - scoreA;
			})
			.slice(0, limit);
	}

	private extractRelevantSnippet(content: string, query: string): string {
		const searchTerms = query.toLowerCase().split(" ");
		const contentLower = content.toLowerCase();

		// Find the first occurrence of any search term
		let startIndex = -1;
		for (const term of searchTerms) {
			const index = contentLower.indexOf(term);
			if (index !== -1) {
				startIndex = index;
				break;
			}
		}

		if (startIndex === -1) {
			return `${content.slice(0, 150)}...`;
		}

		// Extract a snippet around the match
		const snippetStart = Math.max(0, startIndex - 75);
		const snippetEnd = Math.min(content.length, startIndex + 150);
		const snippet = content.slice(snippetStart, snippetEnd);

		return `${snippetStart > 0 ? "..." : ""}${snippet}${snippetEnd < content.length ? "..." : ""}`;
	}
}
