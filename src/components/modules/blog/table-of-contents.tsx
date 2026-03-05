"use client";

import { type KeyboardEvent, useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { cn } from "@/lib/utils";
import { TOCSkeleton } from "./skeleton";

interface Heading {
	id: string;
	text: string;
	level: number;
}

interface TableOfContentsProps {
	headings: Heading[];
}

function TableOfContentsInner({ headings }: TableOfContentsProps) {
	const [activeId, setActiveId] = useState<string>("");

	const handleClick = useCallback((id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
			// Focus management for accessibility
			element.focus({ preventScroll: true });
		}
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLButtonElement>, id: string) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				handleClick(id);
			}
		},
		[handleClick]
	);

	useEffect(() => {
		// Guard against environments where IntersectionObserver isn't available
		if (!window.IntersectionObserver) {
			console.warn("IntersectionObserver not available, TOC active state disabled");
			return;
		}

		let observer: IntersectionObserver;

		try {
			observer = new IntersectionObserver(
				(entries) => {
					// Find the first heading that's visible (intersecting)
					const visibleHeading = entries.find((entry) => entry.isIntersecting);
					if (visibleHeading) {
						setActiveId(visibleHeading.target.id);
					}
				},
				{
					rootMargin: "-80px 0px -80% 0px", // Trigger when heading is near top of viewport
					threshold: 0.1,
				}
			);

			// Observe all headings with error handling
			headings.forEach(({ id }) => {
				try {
					const element = document.getElementById(id);
					if (element) {
						observer.observe(element);
					}
				} catch (error) {
					console.warn(`Failed to observe heading with id: ${id}`, error);
				}
			});
		} catch (error) {
			console.error("Failed to create IntersectionObserver:", error);
		}

		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	}, [headings]);

	if (headings.length === 0) {
		return null;
	}

	return (
		<aside className="blog-toc" role="complementary" aria-label="Table of contents">
			<div className="px-4 py-3 border-b border-border">
				<h4
					className="font-medium text-sm text-muted-foreground uppercase tracking-wide"
					id="toc-heading"
				>
					Table of Contents
				</h4>
			</div>
			<nav className="p-4" role="navigation" aria-labelledby="toc-heading">
				<ul className="space-y-1" role="list">
					{headings.map(({ id, text, level }, index) => (
						<li key={id} role="listitem">
							<button
								type="button"
								onClick={() => handleClick(id)}
								onKeyDown={(e) => handleKeyDown(e, id)}
								className={cn(
									"block w-full text-left text-sm transition-colors duration-200 py-1.5 px-2 rounded-md hover:bg-muted/60 focus:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
									"toc-link",
									activeId === id && "active bg-muted/80 text-foreground font-medium",
									level === 2 && "pl-2",
									level === 3 && "pl-6",
									level === 4 && "pl-10",
									level > 4 && "pl-14"
								)}
								aria-current={activeId === id ? "location" : undefined}
								aria-label={`Go to ${text} (heading level ${level})`}
								tabIndex={0}
							>
								<span className="block truncate">{text}</span>
							</button>
						</li>
					))}
				</ul>
			</nav>
		</aside>
	);
}

/**
 * Error fallback component for TOC
 */
function TOCErrorFallback({
	error,
	resetErrorBoundary,
}: {
	error: Error;
	resetErrorBoundary: () => void;
}) {
	return (
		<div className="blog-toc">
			<div className="px-4 py-3 border-b border-border">
				<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
					Table of Contents
				</h4>
			</div>
			<div className="p-4 text-center">
				<p className="text-sm text-muted-foreground mb-2">Failed to load table of contents</p>
				<button onClick={resetErrorBoundary} className="text-xs text-primary hover:underline">
					Try again
				</button>
			</div>
		</div>
	);
}

/**
 * Table of Contents component with error boundary
 */
export function TableOfContents({ headings }: TableOfContentsProps) {
	return (
		<ErrorBoundary
			FallbackComponent={TOCErrorFallback}
			onError={(error, errorInfo) => {
				console.error("TOC Error:", error, errorInfo);
			}}
		>
			<TableOfContentsInner headings={headings} />
		</ErrorBoundary>
	);
}
