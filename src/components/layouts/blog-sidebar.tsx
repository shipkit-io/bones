"use client";

import {
	BookOpenIcon,
	ClockIcon,
	MenuIcon,
	SearchIcon,
	TagIcon,
	TrendingUpIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Link } from "@/components/primitives/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { siteConfig } from "@/config/site-config";
import type { BlogPost } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface BlogSidebarProps {
	posts: BlogPost[];
}

const BlogNavigation = ({ posts }: BlogSidebarProps) => {
	const pathname = usePathname();
	const [searchQuery, setSearchQuery] = useState("");

	// Filter posts based on search query
	const filteredPosts = useMemo(() => {
		if (!searchQuery.trim()) return posts;

		const query = searchQuery.toLowerCase();
		return posts.filter(
			(post) =>
				post.title?.toLowerCase().includes(query) ||
				post.description?.toLowerCase().includes(query) ||
				post.categories?.some((cat) => cat.toLowerCase().includes(query))
		);
	}, [posts, searchQuery]);

	// Get recent posts (latest 5)
	const recentPosts = useMemo(() => {
		return [...posts]
			.sort((a, b) => {
				if (!a.publishedAt || !b.publishedAt) return 0;
				return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
			})
			.slice(0, 5);
	}, [posts]);

	// Get all unique categories
	const allCategories = useMemo(() => {
		const cats = new Set<string>();
		posts.forEach((post) => {
			post.categories?.forEach((cat) => cats.add(cat));
		});
		return Array.from(cats).sort();
	}, [posts]);

	const content = (
		<div className="h-full flex flex-col w-full max-w-full overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-3 px-2 py-4">
				<div>
					<h2 className="font-semibold text-foreground">{siteConfig.name} Blog</h2>
				</div>
			</div>

			{/* Search */}
			<div className="relative px-2 mb-4">
				<SearchIcon className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search articles..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-10 h-9 bg-background border-border"
				/>
			</div>

			{/* Navigation Content */}
			<ScrollArea className="flex-1 px-2 w-full [&>[data-radix-scroll-area-viewport]>div]:!block">
				<div className="space-y-6 w-full max-w-full">
					{/* Search Results */}
					{searchQuery && (
						<div>
							<div className="flex items-center justify-between mb-3">
								<h3 className="font-medium text-sm text-foreground">Search Results</h3>
								<Badge variant="secondary" className="text-xs">
									{filteredPosts.length} found
								</Badge>
							</div>
							<div className="space-y-1">
								{filteredPosts.map((post) => {
									const isActive = pathname === `/blog/${post.slug}`;
									return (
										<Link
											key={post.slug}
											href={`/blog/${post.slug}`}
											className={cn(
												"flex items-center gap-2 p-2 rounded-md transition-colors group min-w-0",
												"hover:bg-accent/50",
												isActive
													? "bg-primary text-primary-foreground font-medium"
													: "text-foreground hover:text-primary"
											)}
										>
											<span className="font-medium text-sm truncate flex-1 min-w-0">
												{post.title}
											</span>
											{post.badge && (
												<Badge
													variant={isActive ? "secondary" : "outline"}
													className="ml-2 text-xs shrink-0"
												>
													{post.badge}
												</Badge>
											)}
										</Link>
									);
								})}
							</div>
							{filteredPosts.length === 0 && (
								<div className="text-center py-4">
									<p className="text-sm text-muted-foreground">No articles found</p>
									<Button
										variant="link"
										size="sm"
										onClick={() => setSearchQuery("")}
										className="mt-2"
									>
										Clear search
									</Button>
								</div>
							)}
						</div>
					)}

					{/* Recent Posts */}
					{!searchQuery && (
						<div>
							<div className="flex items-center gap-2 mb-3">
								<TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium text-sm text-foreground">Latest</h3>
							</div>
							<div className="space-y-1">
								{recentPosts.map((post) => {
									const isActive = pathname === `/blog/${post.slug}`;
									return (
										<Link
											key={post.slug}
											href={`/blog/${post.slug}`}
											className={cn(
												"flex items-center gap-2 p-2 rounded-md transition-colors group min-w-0",
												"hover:bg-accent/50",
												isActive
													? "bg-primary text-primary-foreground font-medium"
													: "text-muted-foreground hover:text-foreground"
											)}
										>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm truncate min-w-0">{post.title}</div>
												{post.publishedAt && (
													<div className="flex items-center gap-1 text-xs opacity-70 mt-0.5">
														<ClockIcon className="h-3 w-3" />
														{new Date(post.publishedAt).toLocaleDateString()}
													</div>
												)}
											</div>
											{post.badge && (
												<Badge variant="secondary" className="ml-2 text-xs shrink-0">
													{post.badge}
												</Badge>
											)}
										</Link>
									);
								})}
							</div>
						</div>
					)}

					{/* Categories */}
					{!searchQuery && allCategories.length > 0 && (
						<>
							<Separator />
							<div>
								<div className="flex items-center gap-2 mb-3">
									<TagIcon className="h-4 w-4 text-muted-foreground" />
									<h3 className="font-medium text-sm text-foreground">Categories</h3>
								</div>
								<div className="space-y-1">
									{allCategories.map((category) => {
										const categoryPosts = posts.filter((post) =>
											post.categories?.includes(category)
										);
										return (
											<Link
												key={category}
												href={`/blog/categories/${encodeURIComponent(category)}`}
												className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors group min-w-0"
											>
												<span className="text-sm text-foreground group-hover:text-primary truncate flex-1 min-w-0">
													{category}
												</span>
												<span className="text-xs text-muted-foreground shrink-0 ml-2">
													{categoryPosts.length}
												</span>
											</Link>
										);
									})}
								</div>
							</div>
						</>
					)}
				</div>
			</ScrollArea>
		</div>
	);

	return (
		<>
			{/* Desktop Sidebar */}
			<aside className="hidden lg:block w-64 xl:w-80 shrink-0 min-w-0">
				<div className="sticky top-[var(--navbar-height)] h-[calc(100vh-var(--navbar-height))] w-full overflow-hidden">
					{content}
				</div>
			</aside>

			{/* Mobile Navigation */}
			<div className="sticky top-0 z-40 lg:hidden">
				<div className="flex items-center gap-2 p-4 bg-background border-b">
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="outline" size="icon" className="shrink-0">
								<MenuIcon className="h-4 w-4" />
								<span className="sr-only">Toggle navigation</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-80 p-0">
							<VisuallyHidden asChild>
								<SheetTitle>Blog Navigation</SheetTitle>
							</VisuallyHidden>
							{content}
						</SheetContent>
					</Sheet>
					<Input
						placeholder="Search articles..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="h-9"
					/>
				</div>
			</div>
		</>
	);
};

export const BlogSidebar = BlogNavigation;
