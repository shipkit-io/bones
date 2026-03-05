"use client";

import { ChevronDown, List } from "lucide-react";
import { type KeyboardEvent, useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Heading } from "@/lib/utils/extract-headings";
import { MobileTOCSkeleton } from "./skeleton";
import { TableOfContents } from "./table-of-contents";

interface MobileTocProps {
	headings: Heading[];
}

function MobileTocInner({ headings }: MobileTocProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleToggle = useCallback(() => {
		setIsOpen(!isOpen);
	}, [isOpen]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLButtonElement>) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				handleToggle();
			}
		},
		[handleToggle]
	);

	if (headings.length === 0) {
		return null;
	}

	return (
		<div className="xl:hidden mb-8" role="complementary" aria-label="Mobile table of contents">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<Button
						variant="outline"
						className="w-full justify-between focus:ring-2 focus:ring-ring focus:ring-offset-2"
						onClick={handleToggle}
						onKeyDown={handleKeyDown}
						aria-expanded={isOpen}
						aria-controls="mobile-toc-content"
						aria-label={`${isOpen ? "Collapse" : "Expand"} table of contents`}
					>
						<div className="flex items-center gap-2">
							<List className="h-4 w-4" aria-hidden="true" />
							<span>Table of Contents</span>
						</div>
						<ChevronDown
							className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
							aria-hidden="true"
						/>
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="mt-4" id="mobile-toc-content" aria-hidden={!isOpen}>
					<div className="border rounded-lg p-4 bg-muted/30">
						<TableOfContents headings={headings} />
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}

/**
 * Error fallback component for Mobile TOC
 */
function MobileTocErrorFallback({
	error,
	resetErrorBoundary,
}: {
	error: Error;
	resetErrorBoundary: () => void;
}) {
	return (
		<div className="xl:hidden mb-8">
			<div className="border rounded-lg p-4 bg-muted/30">
				<div className="text-center">
					<p className="text-sm text-muted-foreground mb-2">Failed to load table of contents</p>
					<button
						onClick={resetErrorBoundary}
						className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
					>
						Try again
					</button>
				</div>
			</div>
		</div>
	);
}

/**
 * Mobile Table of Contents component with error boundary
 */
export const MobileToc = ({ headings }: MobileTocProps) => {
	return (
		<ErrorBoundary
			FallbackComponent={MobileTocErrorFallback}
			onError={(error, errorInfo) => {
				console.error("Mobile TOC Error:", error, errorInfo);
			}}
		>
			<MobileTocInner headings={headings} />
		</ErrorBoundary>
	);
};
