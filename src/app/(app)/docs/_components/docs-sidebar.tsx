"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { NavSection } from "@/lib/docs";
import { cn } from "@/lib/utils/cn";

interface DocsSidebarProps {
	className?: string;
	navigation: NavSection[];
}

export function DocsSidebar({ className, navigation }: DocsSidebarProps) {
	const pathname = usePathname();

	return (
		<div className={cn("w-full", className)}>
			<Accordion
				type="multiple"
				defaultValue={navigation.map((section) => section.title)}
				className="space-y-1"
			>
				{navigation.map((section) => (
					<AccordionItem key={section.title} value={section.title} className="border-none px-1">
						<AccordionTrigger className="py-1.5 text-sm hover:no-underline">
							<span className="font-medium text-foreground/70">{section.title}</span>
						</AccordionTrigger>
						{section.items?.length && (
							<AccordionContent className="pb-1 pt-0">
								<div className="ml-3 flex flex-col gap-1">
									{section.items.map((item) => (
										<Link
											key={item.href}
											href={item.href}
											className={cn(
												"flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors",
												"hover:bg-accent hover:text-accent-foreground",
												pathname === item.href
													? "font-medium text-foreground bg-accent"
													: "text-foreground/60"
											)}
										>
											{item.title}
										</Link>
									))}
								</div>
							</AccordionContent>
						)}
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
}
