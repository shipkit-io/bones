import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogPostComponent } from "@/components/modules/blog/post";
import { BlogPostListSkeleton } from "@/components/modules/blog/skeleton";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { type BlogPost, getBlogPosts } from "@/lib/blog";
import { formatDate } from "@/lib/utils/format-date";

export const metadata: Metadata = constructMetadata({
	title: "Blog - Latest Updates & Guides | Shipkit",
	description:
		"Stay up to date with the latest app development trends, tutorials, and best practices. Learn how to build better apps faster with Shipkit's expert guides and tips.",
});

// Enhanced BlogPost type with LogSpot-style fields
interface EnhancedBlogPost extends BlogPost {
	badge?: string;
	authors?: { name: string; avatar: string }[];
}

const BlogPage = async () => {
	const posts: BlogPost[] = await getBlogPosts();

	// Transform posts to LogSpot format with demo data
	const logSpotPosts: EnhancedBlogPost[] = posts.map((post, index) => ({
		...post,
		badge: post.badge || `v1.${index.toString().padStart(2, "0")}`,
		authors: post.authors || [
			{
				name: siteConfig.creator.fullName,
				avatar: siteConfig.creator.avatar,
			},
		],
	}));

	return (
		<div className="w-full">
			{/* Timeline container with proper spacing */}
			<Suspense fallback={<BlogPostListSkeleton count={3} />}>
				<div className="space-y-8">
					{logSpotPosts.map((post) => {
						const formattedDate = formatDate(post.publishedAt);

						return (
							<BlogPostComponent key={post.slug} post={post}>
								{post.description && <p>{post.description}</p>}
								{formattedDate && (
									<p className="text-sm text-muted-foreground">Published on {formattedDate}</p>
								)}
							</BlogPostComponent>
						);
					})}
				</div>
			</Suspense>
		</div>
	);
};

export default BlogPage;
