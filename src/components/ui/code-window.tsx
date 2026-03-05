"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { ExpandIcon, MinimizeIcon } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

const codeWindowVariants = cva("overflow-hidden rounded-lg border transition-all duration-200", {
	variants: {
		variant: {
			default: "bg-neutral-900",
			minimal: "bg-muted/50",
			ghost: "border-none bg-transparent",
			single:
				"relative inline-flex items-center border-none bg-muted/30 rounded-md hover:bg-muted/50",
		},
		size: {
			default: "w-full",
			sm: "max-w-sm",
			lg: "max-w-screen-lg",
			inline: "w-auto",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
	compoundVariants: [
		{
			variant: "single",
			size: "default",
			class: "size: inline",
		},
	],
});

const titleBarVariants = cva("flex items-center justify-between px-4 py-2", {
	variants: {
		variant: {
			default: "border-b bg-neutral-800",
			minimal: "border-b bg-muted",
			ghost: "bg-transparent",
			single: "hidden",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

const codeContentVariants = cva("overflow-auto", {
	variants: {
		variant: {
			default: "p-4",
			minimal: "p-4 bg-transparent",
			ghost: "px-0",
			single:
				"flex items-center justify-between border-none bg-muted/30 rounded-md hover:bg-muted/50 py-1 px-2",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

interface CodeWindowProps extends VariantProps<typeof codeWindowVariants> {
	title?: string;
	code: string;
	language?: string;
	showCopy?: boolean;
	showLineNumbers?: boolean;
	highlightLines?: number[];
	theme?: "dark" | "light";
	maxHeight?: string;
	className?: string;
	wrapLongLines?: boolean;
	variant?: "default" | "minimal" | "ghost" | "single";
	size?: "default" | "sm" | "lg" | "inline";
}

export const CodeWindow = ({
	title = "",
	code,
	language = "typescript",
	showCopy = true,
	showLineNumbers = true,
	highlightLines = [],
	theme = "dark",
	maxHeight = "500px",
	wrapLongLines = false,
	variant = "default",
	size = "default",
	className,
}: CodeWindowProps) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	const isSingle = variant === "single";

	return (
		<div
			className={cn(
				codeWindowVariants({ variant, size }),
				isExpanded && !isSingle && "fixed inset-0 z-40 bg-background",
				className
			)}
		>
			{/* Title Bar */}
			<div className={cn(titleBarVariants({ variant }))}>
				<div className="flex items-center gap-2">
					{variant === "default" && (
						<div className="flex gap-2">
							<div className="size-3 rounded-full bg-red-500" />
							<div className="size-3 rounded-full bg-yellow-500" />
							<div className="size-3 rounded-full bg-green-500" />
						</div>
					)}
					{title && (
						<span
							className={cn(
								"ml-2 text-sm",
								variant === "default" ? "text-neutral-400" : "text-muted-foreground"
							)}
						>
							{title}
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{showCopy && !isSingle && <CopyButton value={code} />}
					{!isSingle && (
						<button
							type="button"
							onClick={toggleExpand}
							className={cn(
								"flex items-center gap-1 rounded px-2 py-1 text-xs",
								variant === "default"
									? "text-neutral-400 hover:bg-neutral-700"
									: "text-muted-foreground hover:bg-muted"
							)}
						>
							{isExpanded ? <MinimizeIcon className="size-3" /> : <ExpandIcon className="size-3" />}
						</button>
					)}
				</div>
			</div>

			{/* Code Content */}
			<div
				className={cn(
					codeContentVariants({ variant }),
					!isExpanded && !isSingle && `max-h-[${maxHeight}]`,
					"group relative"
				)}
			>
				<SyntaxHighlighter
					language={language}
					style={theme === "dark" ? oneDark : oneLight}
					showLineNumbers={showLineNumbers && !isSingle}
					wrapLines={true}
					wrapLongLines={wrapLongLines}
					lineProps={(lineNumber) => ({
						style: {
							backgroundColor: highlightLines.includes(lineNumber)
								? "rgba(255,255,255,0.1)"
								: undefined,
							display: "block",
							width: "100%",
						},
					})}
					customStyle={{
						margin: 0,
						padding: 0,
						background: "transparent",
						fontSize: isSingle ? "0.875rem" : undefined,
					}}
				>
					{code}
				</SyntaxHighlighter>
				{isSingle && showCopy && <CopyButton value={code} className="ml-1" />}
			</div>
		</div>
	);
};
