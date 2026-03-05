import type React from "react";
import { Card } from "@/components/ui/card";
import { TableOfContents } from "./table-of-contents";

interface DocLayoutProps {
	children: React.ReactNode;
	toc: {
		id: string;
		text: string;
		level: number;
	}[];
}

export const DocLayout = ({ children, toc }: DocLayoutProps) => {
	return (
		<div className="container flex gap-10 py-8">
			<article className="prose prose-slate max-w-3xl flex-1 dark:prose-invert">
				<Card className="p-6">
					<div
						className={`/* Headings */ /* Paragraphs */ /* Lists */ /* Decimal Leading Zero Lists */ [&>ol[style*='decimal-leading-zero']]:counter-reset-[section] [&>ol[style*='decimal-leading-zero']>li]:counter-increment-[section] text-base leading-relaxed prose-headings:scroll-mt-md [&>h1]:mb-4 [&>h1]:mt-6 [&>h1]:text-3xl [&>h1]:font-bold [&>h2]:mb-4 [&>h2]:mt-6 [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:mb-4 [&>h3]:mt-6 [&>h3]:text-xl [&>h3]:font-bold [&>h4]:mb-4 [&>h4]:mt-6 [&>h4]:text-lg [&>h4]:font-bold [&>ol>li]:mb-2 [&>ol[style*='decimal-leading-zero']>li:before]:absolute [&>ol[style*='decimal-leading-zero']>li:before]:left-0 [&>ol[style*='decimal-leading-zero']>li:before]:font-normal [&>ol[style*='decimal-leading-zero']>li:before]:text-gray-600 [&>ol[style*='decimal-leading-zero']>li:before]:content-[counter(section,decimal-leading-zero)'.'] [&>ol[style*='decimal-leading-zero']>li]:relative [&>ol[style*='decimal-leading-zero']>li]:pl-12 [&>ol[style*='decimal-leading-zero']]:list-none [&>ol]:mb-4 [&>ol]:list-decimal [&>ol]:pl-8 [&>p]:mb-4 [&>ul>li]:mb-2 [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-8`}
					>
						{children}
					</div>
				</Card>
			</article>
			<aside className="hidden w-64 lg:block">
				<TableOfContents headings={toc} />
			</aside>
		</div>
	);
};
