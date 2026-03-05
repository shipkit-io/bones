import { BlogPostListSkeleton } from "@/components/modules/blog/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthorPageLoading() {
	return (
		<div className="w-full max-w-6xl mx-auto">
			{/* Author Profile Section */}
			<div className="mb-12">
				<div className="flex flex-col lg:flex-row gap-8 items-start">
					{/* Author Profile Card Skeleton */}
					<div className="w-full lg:w-96 flex-shrink-0">
						<Card className="w-full max-w-md">
							<CardHeader className="pb-4">
								<div className="flex flex-col sm:flex-row gap-4 items-start">
									<div className="relative">
										<Skeleton className="w-20 h-20 rounded-full" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex flex-col gap-2 mb-3">
											<Skeleton className="h-8 w-48" />
											<Skeleton className="h-6 w-16" />
										</div>
										<Skeleton className="h-4 w-32 mb-3" />
										<div className="flex flex-wrap gap-3">
											<Skeleton className="h-4 w-24" />
											<Skeleton className="h-4 w-16" />
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* About section */}
								<div>
									<Skeleton className="h-5 w-16 mb-3" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-3/4" />
									</div>
								</div>

								{/* Social links */}
								<div>
									<Skeleton className="h-5 w-20 mb-3" />
									<div className="flex flex-wrap gap-2">
										<Skeleton className="h-8 w-20" />
										<Skeleton className="h-8 w-16" />
										<Skeleton className="h-8 w-18" />
									</div>
								</div>

								{/* View all posts button */}
								<div className="pt-4">
									<Skeleton className="h-9 w-full" />
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Header section */}
					<div className="flex-1 lg:pt-8">
						<Skeleton className="h-12 w-80 mb-4" />
						<Skeleton className="h-6 w-32" />
					</div>
				</div>
			</div>

			{/* Posts Section */}
			<div className="mb-8">
				<Skeleton className="h-8 w-32 mb-6" />
			</div>

			{/* Posts List */}
			<div className="grid gap-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i} className="transition-colors">
						<CardHeader>
							<div className="flex flex-wrap gap-2 mb-2">
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-6 w-20" />
							</div>
							<Skeleton className="h-7 w-full max-w-md mb-2" />
							<Skeleton className="h-5 w-full max-w-lg" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-4 w-24" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
