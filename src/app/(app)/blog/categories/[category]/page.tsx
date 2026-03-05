import { Link } from "@/components/primitives/link";
import { Badge } from "@/components/ui/badge";
import { getBlogCategories, getBlogPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";

// Generate static paths for all blog categories
export async function generateStaticParams() {
	const posts = await getBlogPosts();
	const categories = getBlogCategories(posts);

	return categories.map((cat) => ({
		// URL-encode the category name for the param
		category: encodeURIComponent(cat.name),
	}));
}

// Use params for route segments - params is now a Promise in Next.js 15
interface CategoryPageProps {
	params: Promise<{
		category: string;
	}>;
}

// Note: The component signature is updated to use params as Promise
export default async function CategoryPage({ params }: CategoryPageProps) {
	// Await the params Promise
	const resolvedParams = await params;
	// Decode the category name from the URL parameter
	const category = decodeURIComponent(resolvedParams.category);

	const posts = await getBlogPosts();
	const categories = getBlogCategories(posts);
	const selectedCategory = category;

	// Filter categories if a category is selected
	const filteredCategories = selectedCategory
		? categories.filter((cat) => cat.name === selectedCategory)
		: categories;

	return (
		<div className="container py-8">
			<h1 className="text-3xl font-bold">{selectedCategory || "All Categories"}</h1>
			<div className="mb-8 flex flex-wrap gap-2">
				{categories.map((cat) => (
					<Link key={cat.name} href={`/blog/categories/${encodeURIComponent(cat.name)}`}>
						<Badge
							variant={cat.name === selectedCategory ? "default" : "secondary"}
							className="hover:bg-secondary/80"
						>
							{cat.name} ({cat.posts.length})
						</Badge>
					</Link>
				))}
			</div>

			<div className="grid gap-8">
				{filteredCategories.map((cat) => (
					<div key={cat.name} className="space-y-4">
						<h2 className="text-2xl font-semibold">{cat.name}</h2>
						<div className="grid gap-4">
							{cat.posts.map((post) => (
								<Link
									key={post.slug}
									href={`/blog/${post.slug}`}
									className={cn("block rounded-lg border p-4 transition-colors hover:bg-muted")}
								>
									<h3 className="mb-2 font-medium">{post.title}</h3>
									{post.description && (
										<p className="text-sm text-muted-foreground">{post.description}</p>
									)}
								</Link>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
