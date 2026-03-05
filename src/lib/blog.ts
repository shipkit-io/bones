import fs from "fs/promises";
import matter from "gray-matter";
import path from "path";
import {
	type BlogAuthor,
	convertLegacyAuthor,
	defaultAuthor,
	getAuthorById,
	getAuthorByName,
} from "@/config/blog-authors";

export interface BlogPost {
	title: string;
	slug: string;
	content: string;
	description?: string;
	author?: string; // Legacy field for backward compatibility
	authorObject?: BlogAuthor; // New structured author object
	publishedAt?: string;
	categories?: string[];
	badge?: string;
	authors?: { name: string; avatar: string }[]; // Legacy field
	authorObjects?: BlogAuthor[]; // New structured author objects
	image?: string;
}

export interface BlogCategory {
	name: string;
	posts: BlogPost[];
}

export async function getBlogPosts(): Promise<BlogPost[]> {
	const postsDirectory = path.join(process.cwd(), "src/content/blog");
	const filenames = await fs.readdir(postsDirectory);

	const posts = await Promise.all(
		filenames.map(async (filename) => {
			const filePath = path.join(postsDirectory, filename);
			const fileContent = await fs.readFile(filePath, "utf-8");
			const { data, content } = matter(fileContent);

			// Handle legacy author field
			let authorObject: BlogAuthor | undefined;
			if (data.author) {
				authorObject = convertLegacyAuthor(data.author);
			}

			// Handle legacy authors array
			let authorObjects: BlogAuthor[] | undefined;
			if (data.authors && Array.isArray(data.authors)) {
				authorObjects = data.authors.map((author: any) => {
					if (typeof author === "string") {
						return convertLegacyAuthor(author);
					}
					if (author.name) {
						return convertLegacyAuthor(author.name);
					}
					return defaultAuthor;
				});
			}

			// Handle new authorId field (if present)
			if (data.authorId) {
				authorObject = getAuthorById(data.authorId);
			}

			// Handle new authorIds array (if present)
			if (data.authorIds && Array.isArray(data.authorIds)) {
				authorObjects = data.authorIds.map((id: string) => getAuthorById(id));
			}

			return {
				title: data.title,
				slug: filename.replace(/\.mdx$/, ""),
				content,
				description: data.description,
				author: data.author, // Keep for backward compatibility
				authorObject,
				publishedAt: data.publishedAt,
				categories: data.categories || [],
				badge: data.badge,
				authors: data.authors, // Keep for backward compatibility
				authorObjects,
				image: data.image,
			};
		})
	);

	return posts;
}

export function getBlogCategories(posts: BlogPost[]): BlogCategory[] {
	const categoriesMap = new Map<string, BlogPost[]>();

	// Add uncategorized first to ensure it's at the top
	categoriesMap.set("Uncategorized", []);

	// Group posts by category
	for (const post of posts) {
		if (!post.categories?.length) {
			const uncategorized = categoriesMap.get("Uncategorized") || [];
			uncategorized.push(post);
			categoriesMap.set("Uncategorized", uncategorized);
		} else {
			for (const category of post.categories) {
				const categoryPosts = categoriesMap.get(category) || [];
				categoryPosts.push(post);
				categoriesMap.set(category, categoryPosts);
			}
		}
	}

	// Convert map to array and sort categories alphabetically
	// keeping Uncategorized at the top if it has posts
	return Array.from(categoriesMap.entries())
		.filter(([_, posts]) => posts.length > 0)
		.map(([name, posts]) => ({
			name,
			posts: posts.sort((a, b) => {
				if (!a.publishedAt || !b.publishedAt) return 0;
				return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
			}),
		}))
		.sort((a, b) => {
			if (a.name === "Uncategorized") return -1;
			if (b.name === "Uncategorized") return 1;
			return a.name.localeCompare(b.name);
		});
}
