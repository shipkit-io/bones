import type { Metadata } from "next";
import { AuthorProfile } from "@/components/modules/blog/author-profile";
import { Link } from "@/components/primitives/link";
import { routes } from "@/config/routes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	authorUtils,
	type BlogAuthor,
	getActiveAuthors,
	getAuthorById,
	getAuthorByName,
} from "@/config/blog-authors";
import { constructMetadata } from "@/config/metadata";
import { getBlogPosts } from "@/lib/blog";
import { formatDate } from "@/lib/utils/format-date";

interface Props {
	params: Promise<{
		author: string;
	}>;
}

export async function generateStaticParams() {
	const posts = await getBlogPosts();
	const activeAuthors = getActiveAuthors();
	const authorIds = new Set<string>();

	// Add author IDs from active authors
	activeAuthors.forEach((author) => authorIds.add(author.id));

	// Add legacy author names that have posts
	posts.forEach((post) => {
		if (post.author) {
			const author = getAuthorByName(post.author);
			authorIds.add(author.id);
		}
		if (post.authorObject) {
			authorIds.add(post.authorObject.id);
		}
		if (post.authorObjects) {
			post.authorObjects.forEach((author) => authorIds.add(author.id));
		}
	});

	return Array.from(authorIds).map((authorId) => ({
		author: encodeURIComponent(authorId),
	}));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const resolvedParams = await params;
	const authorId = decodeURIComponent(resolvedParams.author);
	const author = getAuthorById(authorId);
	const displayName = authorUtils.getDisplayName(author);

	return constructMetadata({
		title: `Posts by ${displayName} | Shipkit Blog`,
		description: `Read all blog posts written by ${displayName}. Discover insights, tutorials, and best practices for app development.`,
	});
}

export default async function AuthorPage({ params }: Props) {
	const resolvedParams = await params;
	const authorId = decodeURIComponent(resolvedParams.author);
	const author = getAuthorById(authorId);
	const displayName = authorUtils.getDisplayName(author);
	const posts = await getBlogPosts();

	// Filter posts by author (support both legacy and new systems)
	const authorPosts = posts.filter((post) => {
		// Check new author system first
		if (post.authorObject && post.authorObject.id === authorId) {
			return true;
		}
		if (post.authorObjects?.some((a) => a.id === authorId)) {
			return true;
		}
		// Check legacy author system
		if (post.author) {
			const legacyAuthor = getAuthorByName(post.author);
			return legacyAuthor.id === authorId;
		}
		return false;
	});

	if (authorPosts.length === 0) {
		return (
			<div className="container py-8">
				<h1 className="text-3xl font-bold mb-4">Author Not Found</h1>
				<p className="text-muted-foreground mb-4">No posts found for author "{displayName}".</p>
				<Link href={routes.blog} className="text-blue-600 hover:text-blue-800 underline">
					← Back to Blog
				</Link>
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="mb-8">
				<div className="flex flex-col lg:flex-row gap-8 mb-8">
					<div className="lg:w-1/3">
						<AuthorProfile author={author} postCount={authorPosts.length} />
					</div>
					<div className="lg:w-2/3">
						<h1 className="text-3xl font-bold mb-2">Posts by {displayName}</h1>
						<p className="text-muted-foreground">
							{authorPosts.length} post{authorPosts.length !== 1 ? "s" : ""} found
						</p>
					</div>
				</div>
			</div>

			<div className="grid gap-6">
				{authorPosts.map((post) => (
					<Card key={post.slug} className="transition-colors hover:bg-muted/50">
						<CardHeader>
							{post.categories && post.categories.length > 0 && (
								<div className="flex flex-wrap gap-2 mb-2">
									{post.categories.map((category) => (
										<Link key={category} href={`/blog/categories/${encodeURIComponent(category)}`}>
											<Badge variant="secondary">{category}</Badge>
										</Link>
									))}
								</div>
							)}
							<Link href={`/blog/${post.slug}`} className="group">
								<CardTitle className="group-hover:underline">{post.title}</CardTitle>
								{post.description && (
									<CardDescription className="mt-2">{post.description}</CardDescription>
								)}
							</Link>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								{post.publishedAt && (
									<time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
