import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Suspense } from "react";
import { BlogImage } from "@/components/modules/blog/image";
import { MobileToc } from "@/components/modules/blog/mobile-toc";
import { MobileTOCSkeleton, TOCSkeleton } from "@/components/modules/blog/skeleton";
import { TableOfContents } from "@/components/modules/blog/table-of-contents";
import { H1, H2, H3, H4, H5, H6 } from "@/components/modules/mdx/heading";
import { buttonVariants } from "@/components/ui/button";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { getBlogPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { extractHeadings, filterHeadingsByLevel } from "@/lib/utils/extract-headings";
import { formatDate, formatDateTimeAttribute } from "@/lib/utils/format-date";
import "@/styles/blog.css";

interface Props {
	params: Promise<{
		slug: string[];
	}>;
}

export async function generateStaticParams() {
	const posts = await getBlogPosts();

	return posts.map((post) => ({
		slug: post.slug.includes("/") ? post.slug.split("/") : [post.slug],
	}));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const resolvedParams = await params;
	const slug = resolvedParams.slug.join("/");
	const posts = await getBlogPosts();
	const post = posts.find((post) => post.slug === slug);

	if (!post) {
		return constructMetadata({
			title: "Post Not Found | Shipkit Blog",
			description:
				"The blog post you're looking for could not be found. Browse our other articles for app development insights and guides.",
		});
	}

	// Build dynamic OG image URL using the existing /og route
	const ogUrl = new URL("/og", siteConfig.url);
	ogUrl.searchParams.set("title", post.title);
	if (post.description) ogUrl.searchParams.set("description", post.description);
	ogUrl.searchParams.set("url", siteConfig.url.replace(/https?:\/\//, ""));

	return constructMetadata({
		title: `${post.title} | Shipkit Blog`,
		description:
			post.description ||
			"Read this comprehensive guide on app development best practices, tips, and insights from the Shipkit team.",
		images: [
			{
				url: ogUrl.toString(),
				width: siteConfig.metadata.openGraph.imageWidth,
				height: siteConfig.metadata.openGraph.imageHeight,
				alt: post.title,
			},
		],
		openGraph: {
			title: post.title,
			description: post.description,
			type: "article",
			publishedTime: post.publishedAt,
			authors: post.author ? [post.author] : undefined,
		},
	});
}

const BlogPostPage = async ({ params }: Props) => {
	const resolvedParams = await params;
	const slug = resolvedParams.slug.join("/");
	const posts = await getBlogPosts();
	const post = posts.find((post) => post.slug === slug);

	if (!post) {
		notFound();
	}

	// Extract headings from content for TOC
	const allHeadings = extractHeadings(post.content);
	const tocHeadings = filterHeadingsByLevel(allHeadings, 2, 4); // Show h2-h4 in TOC

	// Safe date formatting
	const dateTimeAttr = formatDateTimeAttribute(post.publishedAt);
	const displayDate = formatDate(post.publishedAt);

	// MDX components with custom headings
	const components = {
		h1: H1,
		h2: H2,
		h3: H3,
		h4: H4,
		h5: H5,
		h6: H6,
	};

	return (
		<div className="relative w-full">
			{/* Back button */}
			<Link
				href={routes.blog}
				className={cn(
					buttonVariants({ variant: "ghost", size: "sm" }),
					"mb-8 h-auto p-0 text-muted-foreground hover:text-foreground"
				)}
			>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back to Blog
			</Link>

			<div className="flex gap-8">
				{/* Main content */}
				<article className="flex-1 min-w-0">
					{/* Mobile TOC */}
					<Suspense fallback={<MobileTOCSkeleton />}>
						<MobileToc headings={tocHeadings} />
					</Suspense>

					{/* Header section */}
					<header className="flex flex-col gap-4 border-b pb-8 mb-8">
						<h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
							{post.title}
						</h1>
						{post.description && (
							<p className="text-xl text-muted-foreground leading-7">{post.description}</p>
						)}

						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								{post.author && <span className="font-medium text-foreground">{post.author}</span>}
								{displayDate && (
									<>
										<span>•</span>
										<time dateTime={dateTimeAttr}>{displayDate}</time>
									</>
								)}
							</div>

							{post.categories && post.categories.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{post.categories.map((category) => (
										<Link
											key={category}
											href={`/blog/categories/${encodeURIComponent(category)}`}
											className={buttonVariants({
												variant: "secondary",
												size: "sm",
											})}
										>
											{category}
										</Link>
									))}
								</div>
							)}
						</div>
					</header>

					{/* Content section */}
					<div className="prose prose-neutral dark:prose-invert max-w-none">
						{/* Featured image */}
						{post.image && (
							<BlogImage src={post.image} alt={post.title} className="mb-8" priority={true} />
						)}
						<MDXRemote source={post.content} components={components} />
					</div>
				</article>

				{/* Table of Contents - Now properly sticky */}
				{tocHeadings.length > 0 && (
					<aside className="hidden lg:block w-64 shrink-0">
						<div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
							<Suspense fallback={<TOCSkeleton />}>
								<TableOfContents headings={tocHeadings} />
							</Suspense>
						</div>
					</aside>
				)}
			</div>
		</div>
	);
};

export default BlogPostPage;
