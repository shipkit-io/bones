import type React from "react";
import { BlogImage } from "@/components/modules/blog/image";
import { Link } from "@/components/primitives/link";
import { authorUtils, type BlogAuthor, getAuthorByName } from "@/config/blog-authors";
import type { BlogPost } from "@/lib/blog";
import { formatDateForBlog } from "@/lib/utils/format-date";
import { BlogAuthors } from "./authors";
import { BlogBadge } from "./badge";

interface BlogPostProps {
	post: BlogPost & {
		badge?: string;
		authors?: { name: string; avatar: string }[]; // Legacy support
		authorObjects?: BlogAuthor[]; // New structured authors
		publishedAt?: string | Date;
		image?: string;
	};
	children: React.ReactNode;
}

export const BlogPostComponent = ({ post, children }: BlogPostProps) => {
	const displayDate = formatDateForBlog(post.publishedAt);

	// Determine which authors to display (prefer new system)
	const authorsToDisplay = post.authorObjects || post.authors;
	const singleAuthor = post.authorObject || (post.author ? { name: post.author } : null);

	return (
		<article className="md:flex">
			<h2 className="content-date h-full mt-px">
				<span>{displayDate}</span>
			</h2>
			<div className="content-block">
				<div className="feed-border" />
				<div className="feed-dot" />
				{post.badge && (
					<BlogBadge label={post.badge} className="absolute -top-6 right-0 md:static mb-4" />
				)}
				<Link href={`/blog/${post.slug}`} className="group">
					<h1 className="text-xl sm:text-3xl font-bold mb-4 group-hover:underline cursor-pointer">
						{post.title}
					</h1>
				</Link>
				{post.image && (
					<BlogImage
						src={post.image}
						alt={post.title}
						className="mb-6 blog-image"
						priority={false}
					/>
				)}
				<div className="document">{children}</div>

				{/* Multiple authors */}
				{authorsToDisplay && authorsToDisplay.length > 0 && (
					<BlogAuthors authors={authorsToDisplay} />
				)}

				{/* Single author link (new system) */}
				{singleAuthor && post.authorObject && (
					<div className="mt-4 text-sm text-muted-foreground">
						By{" "}
						<Link
							href={authorUtils.getAuthorUrl(post.authorObject)}
							className="text-foreground hover:underline font-medium"
						>
							{authorUtils.getDisplayName(post.authorObject)}
						</Link>
					</div>
				)}

				{/* Single author link (legacy support) */}
				{singleAuthor && !post.authorObject && post.author && (
					<div className="mt-4 text-sm text-muted-foreground">
						By{" "}
						<Link
							href={authorUtils.getAuthorUrl(getAuthorByName(post.author))}
							className="text-foreground hover:underline font-medium"
						>
							{authorUtils.getDisplayName(getAuthorByName(post.author))}
						</Link>
					</div>
				)}
			</div>
		</article>
	);
};
