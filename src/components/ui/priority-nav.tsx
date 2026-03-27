"use client";

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

import { Link } from "@/components/primitives/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavLink } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface PriorityNavProps {
	navLinks: NavLink[];
	className?: string;
	itemClassName?: string;
}

const ITEM_GAP = 16; // gap-md in px
const MORE_BUTTON_WIDTH = 80; // width reserved for the "More" button

/**
 * Priority Navigation
 *
 * Renders all items in a hidden absolute sibling for stable width measurement,
 * then shows only as many items as fit in the visible container. No feedback
 * loops — the measurement container never affects the live layout.
 */
export const PriorityNav: React.FC<PriorityNavProps> = ({
	navLinks,
	className,
	itemClassName,
}) => {
	const outerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	const [visibleCount, setVisibleCount] = useState(navLinks.length);

	useEffect(() => {
		const outer = outerRef.current;
		const measure = measureRef.current;
		if (!outer || !measure) return;

		const calculate = () => {
			const containerWidth = outer.offsetWidth;
			if (containerWidth === 0) return;

			const items = measure.querySelectorAll<HTMLElement>("[data-measure-item]");
			let usedWidth = 0;
			let count = 0;

			for (let i = 0; i < navLinks.length; i++) {
				const el = items[i];
				if (!el) continue;
				const itemWidth = el.offsetWidth + (i > 0 ? ITEM_GAP : 0);
				const remainingAfterThis = navLinks.length - (count + 1);
				const totalNeeded =
					usedWidth + itemWidth + (remainingAfterThis > 0 ? ITEM_GAP + MORE_BUTTON_WIDTH : 0);

				if (totalNeeded > containerWidth) break;

				usedWidth += itemWidth;
				count++;
			}

			setVisibleCount(count);
		};

		const ro = new ResizeObserver(calculate);
		ro.observe(outer);
		calculate();

		return () => ro.disconnect();
	}, [navLinks]);

	const visibleLinks = navLinks.slice(0, visibleCount);
	const overflowLinks = navLinks.slice(visibleCount);

	return (
		<div ref={outerRef} className={cn("relative flex flex-1 min-w-0 overflow-hidden items-center", className)}>
			{/* Hidden measurement bar — absolutely positioned, no effect on layout */}
			<div
				ref={measureRef}
				aria-hidden
				className="pointer-events-none invisible absolute left-0 top-0 flex items-center gap-md"
			>
				{navLinks.map((link, i) => (
					<span
						key={`measure-${i}-${link.href}`}
						data-measure-item
						className={cn(
							"whitespace-nowrap text-sm",
							itemClassName,
						)}
					>
						{link.label}
					</span>
				))}
			</div>

			{/* Visible nav */}
			<div className="flex items-center gap-md">
				{visibleLinks.map((link) => (
					<Link
						key={`${link.href}-${link.label}`}
						href={link.href}
						className={cn(
							"whitespace-nowrap text-sm transition-colors hover:text-foreground shrink-0",
							link.isCurrent ? "text-foreground" : "text-muted-foreground",
							itemClassName,
						)}
					>
						{link.label}
					</Link>
				))}

				<AnimatePresence>
					{overflowLinks.length > 0 && (
						<motion.div
							key="more"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ duration: 0.15 }}
							className="shrink-0"
						>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-auto gap-1 px-2 py-1 text-sm font-normal text-muted-foreground hover:text-foreground"
									>
										More
										<ChevronDownIcon className="h-3 w-3" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="min-w-[140px]">
									{overflowLinks.map((link) => (
										<DropdownMenuItem key={`${link.href}-${link.label}`} asChild>
											<Link
												href={link.href}
												className={cn(
													"w-full cursor-pointer",
													link.isCurrent && "font-medium",
												)}
											>
												{link.label}
											</Link>
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
};

export default PriorityNav;
