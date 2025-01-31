import { Card } from "@/components/mdx/card";
import { CardGroup } from "@/components/mdx/card-group";
import { MDXContentWrapper } from "@/components/mdx/mdx-content-wrapper";
import { promises as fs } from "fs";
import type { MDXComponents } from "mdx/types";
import { headers } from "next/headers";
import path from "path";

// This file is a server component that only handles the initial wrapping
// All client-side MDX components are defined in mdx-provider.tsx

// const fumadocsComponents = await import('fumadocs-ui/mdx');

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		// // Allows customizing built-in components, e.g. to add styling.
		// h1: ({ children }) => (
		// 	<h1 className="mb-4 text-4xl font-bold">{children}</h1>
		// ),
		// h2: ({ children }) => (
		// 	<h2 className="mb-3 text-3xl font-bold">{children}</h2>
		// ),
		// h3: ({ children }) => (
		// 	<h3 className="mb-2 text-2xl font-bold">{children}</h3>
		// ),
		// p: ({ children }) => <p className="mb-4">{children}</p>,
		// ul: ({ children }) => <ul className="mb-4 list-disc pl-6">{children}</ul>,
		// ol: ({ children }) => (
		// 	<ol className="mb-4 list-decimal pl-6">{children}</ol>
		// ),
		// li: ({ children }) => <li className="mb-1">{children}</li>,
		// a: ({ href, children }) => (
		// 	<a href={href} className="text-blue-500 underline hover:text-blue-700">
		// 		{children}
		// 	</a>
		// ),
		// blockquote: ({ children }) => (
		// 	<blockquote className="mb-4 border-l-4 border-gray-200 pl-4 italic">
		// 		{children}
		// 	</blockquote>
		// ),
		// Add custom components
		Card,
		CardGroup,
		// Add the wrapper component
		wrapper: async ({ children }: { children: any }) => {
			// Get the raw content by traversing the MDX tree
			const raw = extractMDXContent(children);

			// Extract file path from MDX component
			const fn = children?.type;
			let filePath = "";
			let fileMatch: RegExpMatchArray | null = null;

			// Try to get the file path from the component's source
			if (typeof fn === "function") {
				const fnString = fn.toString();
				fileMatch = fnString.match(/fileName: "(?:\[project\]\/)?(.+?)"/);
				if (fileMatch?.[1]) {
					// Convert .mdx.tsx path to .mdx
					filePath = fileMatch[1].replace(/\.mdx\.tsx$/, ".mdx");
				}
			}

			// Fallback to request path if no file path found
			if (!filePath) {
				const headersList = await headers();
				const requestPath = headersList.get("x-invoke-path") || "";
				filePath = requestPath ? `src/app${requestPath}/page.mdx` : "";
			}

			return (
				<MDXContentWrapper
					raw={raw}
					filePath={filePath}
					className="bg-gray-900"
				>
					{children}
				</MDXContentWrapper>
			);
		},
		// Merge custom components last to allow overrides
		...components,
	};
}

// Helper function to extract content from MDX tree
function extractMDXContent(node: any): string {
	if (!node) return "";

	// Handle MDX content function
	if (node.type?._payload?._result?.default) {
		const MdxContent = node.type._payload._result.default;
		return extractMDXContent(MdxContent());
	}

	// If it's a function that creates MDX content
	if (
		typeof node.type === "function" &&
		node.type.name === "_createMdxContent"
	) {
		try {
			const content = node.type(node.props);
			return extractMDXContent(content);
		} catch (error) {
			console.error("Error executing MDX content function:", error);
			return "";
		}
	}

	// If it's a text node, return its content
	if (typeof node === "string") {
		return node.trim();
	}

	// If it's an array, process each item
	if (Array.isArray(node)) {
		return node.map(extractMDXContent).filter(Boolean).join("\n");
	}

	// If it's a React element
	if (node.props) {
		// Get the component name
		const tag = node.type?.name || node.type || "";

		// Process children
		const content = extractMDXContent(node.props.children);
		if (!content) return "";

		// Format based on component type
		switch (tag) {
			case "h1":
				return `# ${content}\n`;
			case "h2":
				return `## ${content}\n`;
			case "h3":
				return `### ${content}\n`;
			case "p":
				return `${content}\n`;
			case "ul": {
				const items = content.split("\n").filter(Boolean);
				return `${items.map((item) => `- ${item}`).join("\n")}\n`;
			}
			case "ol": {
				const items = content.split("\n").filter(Boolean);
				return `${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}\n`;
			}
			case "li":
				return content;
			case "a":
				return `[${content}](${node.props.href})`;
			case "blockquote": {
				const lines = content.split("\n").filter(Boolean);
				return `${lines.map((line) => `> ${line}`).join("\n")}\n`;
			}
			case "hr":
				return "---\n";
			case "br":
				return "\n";
			case "strong":
				return `**${content}**`;
			case "em":
				return `*${content}*`;
			case "code":
				return node.props.className
					? `\`\`\`${node.props.className.replace("language-", "")}\n${content}\n\`\`\`\n`
					: `\`${content}\``;
			case "pre":
				return content; // Let the code block handle formatting
			case "Card":
			case "CardGroup":
				// Keep custom components as-is
				return `<${tag}>${content}</${tag}>\n`;
			default:
				return content;
		}
	}

	// Try to get content from any available property
	if (typeof node === "object") {
		if (node.value) return node.value.trim();
		if (node.content) return node.content.trim();
		if (node.children) return extractMDXContent(node.children);
	}

	return "";
}

// Add test helper at the bottom of the file
async function testPath(filePath: string) {
	try {
		await fs.access(path.join(process.cwd(), filePath));
		return true;
	} catch {
		return false;
	}
}
