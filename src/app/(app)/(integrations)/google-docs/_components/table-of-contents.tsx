"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TableOfContentsProps {
	headings: {
		id: string;
		text: string;
		level: number;
	}[];
}

export const TableOfContents = ({ headings }: TableOfContentsProps) => {
	const [activeId, setActiveId] = useState<string>("");

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				// Find the first visible heading
				const visible = entries.find((entry) => entry.isIntersecting);
				if (visible) {
					setActiveId(visible.target.id);
				}
			},
			{
				rootMargin: "0% 0% -80% 0%",
				threshold: 0.2,
			}
		);

		for (const heading of headings) {
			const element = document.getElementById(heading.id);
			if (element) observer.observe(element);
		}

		return () => observer.disconnect();
	}, [headings]);

	return (
		<nav className="sticky top-20 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden rounded-lg border bg-card p-4 shadow-sm">
			<h4 className="mb-4 font-semibold text-foreground">On This Page</h4>
			<ul className="space-y-2.5 text-sm">
				{headings.map((heading) => (
					<li
						key={heading.id}
						className={cn(
							"transition-all duration-200 ease-in-out",
							heading.level === 2 ? "ml-0" : `ml-${(heading.level - 2) * 3}`
						)}
					>
						<a
							href={`#${heading.id}`}
							onClick={(e) => {
								e.preventDefault();
								document.getElementById(heading.id)?.scrollIntoView({
									behavior: "smooth",
								});
							}}
							className={cn(
								"group flex items-center py-1",
								"text-muted-foreground hover:text-foreground",
								"transition-all duration-200",
								activeId === heading.id && "font-medium text-primary"
							)}
						>
							<span
								className={cn(
									"relative mr-2 flex h-1.5 w-1.5",
									"rounded-full bg-muted",
									"transition-all duration-200",
									activeId === heading.id && "bg-primary",
									"group-hover:scale-125 group-hover:bg-primary"
								)}
							/>
							<span
								className={cn("inline-block transition-transform", "group-hover:translate-x-[2px]")}
							>
								{heading.text}
							</span>
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
};
