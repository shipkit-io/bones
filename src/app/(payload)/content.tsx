import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/types/blocks";

interface ContentProps {
	block: ContentBlock;
	className?: string;
}

interface LexicalNode {
	type: string;
	tag?: string;
	children?: { text?: string }[];
}

function renderLexicalNode(node: LexicalNode, index: string) {
	switch (node.type) {
		case "paragraph":
			return (
				<p key={`p-${index}`} className="mb-4">
					{node.children?.[0]?.text || ""}
				</p>
			);
		case "heading":
			switch (node.tag) {
				case "h1":
					return (
						<h1 key={`h1-${index}`} className="mb-4 text-4xl font-bold">
							{node.children?.[0]?.text || ""}
						</h1>
					);
				case "h2":
					return (
						<h2 key={`h2-${index}`} className="mb-4 text-3xl font-bold">
							{node.children?.[0]?.text || ""}
						</h2>
					);
				case "h3":
					return (
						<h3 key={`h3-${index}`} className="mb-4 text-2xl font-bold">
							{node.children?.[0]?.text || ""}
						</h3>
					);
				default:
					return (
						<h4 key={`h4-${index}`} className="mb-4 text-xl font-bold">
							{node.children?.[0]?.text || ""}
						</h4>
					);
			}
		default:
			return null;
	}
}

export const Content = ({ block, className }: ContentProps) => {
	const { content, width = "default", background = "none" } = block;

	const nodes = content?.root?.children || [];

	return (
		<section
			className={cn(
				"py-16",
				{
					"bg-muted": background === "gray",
					"bg-primary/5": background === "accent",
				},
				className
			)}
		>
			<div
				className={cn("container mx-auto px-4", {
					"max-w-7xl": width === "wide",
					"max-w-3xl": width === "narrow",
					"max-w-5xl": width === "default",
				})}
			>
				<div className="prose prose-gray dark:prose-invert max-w-none">
					{nodes.map((node: LexicalNode, i: number) => renderLexicalNode(node, `node-${i}`))}
				</div>
			</div>
		</section>
	);
};
