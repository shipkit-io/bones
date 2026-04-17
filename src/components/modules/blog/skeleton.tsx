import { Skeleton } from "@/components/ui/skeleton";

export const BlogPostSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-32 w-full" />
  </div>
);

export const BlogPostListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-8">
    {Array.from({ length: count }).map((_, i) => (
      <BlogPostSkeleton key={i} />
    ))}
  </div>
);
