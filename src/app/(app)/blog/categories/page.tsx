import { Link } from "@/components/primitives/link";
import { Badge } from "@/components/ui/badge";
import { getBlogCategories, getBlogPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface Props {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CategoriesPage({ searchParams }: Props) {
	const params = await searchParams;
	const posts = await getBlogPosts();
	const categories = getBlogCategories(posts);
	const selectedCategory = typeof params.category === "string" ? params.category : undefined;

	// Filter categories if a category is selected
	const filteredCategories = selectedCategory
		? categories.filter((category) => category.name === selectedCategory)
		: categories;

	return (
		<div className="container py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Blog Categories</h1>
				{selectedCategory && (
					<Link
						href="/blog/categories"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						Clear filter
					</Link>
				)}
			</div>

			<div className="mb-8 flex flex-wrap gap-2">
				{categories.map((category) => (
					<Link key={category.name} href={`/blog/categories/${encodeURIComponent(category.name)}`}>
						<Badge
							variant={category.name === selectedCategory ? "default" : "secondary"}
							className="hover:bg-secondary/80"
						>
							{category.name} ({category.posts.length})
						</Badge>
					</Link>
				))}
			</div>

			<div className="grid gap-8">
				{filteredCategories.map((category) => (
					<div key={category.name} className="space-y-4">
						<h2 className="text-2xl font-semibold">{category.name}</h2>
						<div className="grid gap-4">
							{category.posts.map((post) => (
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
