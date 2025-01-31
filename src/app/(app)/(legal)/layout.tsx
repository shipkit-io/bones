import { cn } from "@/lib/utils";

export default function MDXLayout({ children }: { children: React.ReactNode }) {
	return (
		<article
			className={cn(
				"prose prose-slate max-w-none dark:prose-invert",
				// Customizing prose
				"prose-headings:scroll-mt-28",
				"prose-h1:text-3xl prose-h1:font-semibold",
				"prose-h2:text-2xl prose-h2:font-semibold",
				"prose-p:text-base prose-p:leading-7",
				"prose-li:text-base prose-li:leading-7",
				"prose-code:rounded-md prose-code:bg-muted prose-code:p-1",
				"prose-pre:rounded-lg prose-pre:bg-muted",
				// Dark mode adjustments
				"dark:prose-code:bg-muted/50",
				"dark:prose-pre:bg-muted/50",
			)}
		>
			{children}
		</article>
	);
}
