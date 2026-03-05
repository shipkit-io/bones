import type { ReactNode } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface HoverInfoProps {
	children: ReactNode;
	content: ReactNode;
	className?: string;
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
	[key: string]: any;
}

/**
 * A hoverable text element that shows additional information in a hover card
 *
 * @example
 * ```tsx
 * <HoverInfo content="This is additional information">
 *   Hover over me
 * </HoverInfo>
 * ```
 */
export const HoverInfo = ({
	children,
	content,
	className,
	side = "top",
	align = "center",
	...rest
}: HoverInfoProps) => {
	return (
		<HoverCard openDelay={200}>
			<HoverCardTrigger asChild>
				<span
					className={cn(
						"font-medium inline-block cursor-help transition-colors duration-200",
						className
					)}
				>
					{children}
				</span>
			</HoverCardTrigger>
			<HoverCardContent className="z-50 w-80" side={side} align={align} {...rest}>
				<div className="space-y-2">{content}</div>
			</HoverCardContent>
		</HoverCard>
	);
};
