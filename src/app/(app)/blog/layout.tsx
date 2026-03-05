import type { ReactNode } from "react";
import { BlogSidebar } from "@/components/layouts/blog-sidebar";
import { BlogHero } from "@/components/modules/blog/hero";
import { getBlogPosts } from "@/lib/blog";
import "@/styles/blog.css";

export default async function BlogLayout({ children }: { children: ReactNode }) {
	const posts = await getBlogPosts();

	return (
		<main className="min-h-screen relative">
			<BlogHero />
			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Mobile: Sidebar navigation is handled internally by BlogSidebar */}
				{/* Desktop: Flex layout with sidebar and content side by side */}
				<div className="lg:flex lg:gap-6">
					{/* Blog Navigation Sidebar */}
					<BlogSidebar posts={posts} />

					{/* Main Content Area */}
					<section className="flex-1 min-w-0 w-full lg:w-auto py-4">{children}</section>
				</div>
			</div>
		</main>
	);
}
