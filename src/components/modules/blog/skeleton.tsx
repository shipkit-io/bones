"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton for individual blog post content
 */
export const BlogPostSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative w-full", className)}>
      {/* Back button skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="flex gap-8">
        {/* Main content skeleton */}
        <article className="min-w-0 flex-1">
          {/* Mobile TOC skeleton */}
          <div className="mb-8 xl:hidden">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Header section skeleton */}
          <header className="mb-8 flex flex-col gap-4 border-b pb-8">
            <Skeleton className="h-12 w-full max-w-3xl" />
            <Skeleton className="h-6 w-full max-w-2xl" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-2" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </header>

          {/* Content skeleton */}
          <div className="prose max-w-none prose-neutral dark:prose-invert">
            {/* Featured image skeleton */}
            <Skeleton className="mb-8 h-64 w-full rounded-lg" />

            {/* Content paragraphs */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />

              <div className="my-6">
                <Skeleton className="mb-4 h-8 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>

              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />

              <div className="my-6">
                <Skeleton className="mb-4 h-8 w-2/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </article>

        {/* TOC skeleton */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-8">
            <TOCSkeleton />
          </div>
        </aside>
      </div>
    </div>
  );
};

/**
 * Skeleton for Table of Contents
 */
export const TOCSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("blog-toc", className)}>
      <div className="border-b border-border px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {/* TOC items */}
          <li>
            <Skeleton className="h-8 w-full" />
          </li>
          <li>
            <Skeleton className="ml-2 h-8 w-5/6" />
          </li>
          <li>
            <Skeleton className="ml-6 h-8 w-4/5" />
          </li>
          <li>
            <Skeleton className="h-8 w-full" />
          </li>
          <li>
            <Skeleton className="ml-2 h-8 w-3/4" />
          </li>
          <li>
            <Skeleton className="h-8 w-5/6" />
          </li>
          <li>
            <Skeleton className="ml-2 h-8 w-2/3" />
          </li>
          <li>
            <Skeleton className="ml-6 h-8 w-3/5" />
          </li>
        </ul>
      </nav>
    </div>
  );
};

/**
 * Skeleton for blog post list item
 */
export const BlogPostListItemSkeleton = ({ className }: { className?: string }) => {
  return (
    <article className={cn("md:flex", className)}>
      <div className="mt-px h-full">
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="content-block">
        <div className="feed-border" />
        <div className="feed-dot" />

        {/* Badge skeleton */}
        <Skeleton className="absolute -top-6 right-0 mb-4 h-6 w-12 md:static" />

        {/* Title skeleton */}
        <Skeleton className="mb-4 h-8 w-full max-w-md" />

        {/* Image skeleton */}
        <Skeleton className="mb-6 h-48 w-full rounded-lg" />

        {/* Content skeleton */}
        <div className="mb-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Author skeleton */}
        <div className="relative z-0 mt-6 flex -space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </article>
  );
};

/**
 * Skeleton for blog post list (index page)
 */
export const BlogPostListSkeleton = ({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) => {
  return (
    <div className={cn("space-y-8", className)}>
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
        <BlogPostListItemSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for blog author info
 */
export const BlogAuthorSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
};

/**
 * Skeleton for blog categories
 */
export const BlogCategoriesSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-14" />
      <Skeleton className="h-6 w-18" />
    </div>
  );
};

/**
 * Skeleton for mobile TOC
 */
export const MobileTOCSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("mb-8 xl:hidden", className)}>
      <Skeleton className="h-10 w-full" />
      <div className="mt-4 rounded-lg border bg-muted/30 p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    </div>
  );
};
