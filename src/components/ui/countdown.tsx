"use client";

import { Timer } from "lucide-react";
import type * as React from "react";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface CountdownProps extends React.HTMLAttributes<HTMLDivElement> {
	targetDate: string | Date;
	showIcon?: boolean;
	variant?: "default" | "success" | "warning" | "danger";
}

/**
 * A countdown component that displays time remaining until a target date
 * @example
 * ```tsx
 * <Countdown targetDate="2024-03-31T23:59:59" />
 * ```
 */
export const Countdown = ({
	targetDate = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30),
	showIcon = true,
	variant = "default",
	className,
	...props
}: CountdownProps) => {
	const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

	const variantStyles = {
		default: "bg-primary/10 text-primary",
		success: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
		warning: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
		danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
	};

	if (isExpired) {
		return null;
	}

	return (
		<div
			className={cn(
				"inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
				variantStyles[variant],
				className
			)}
			{...props}
		>
			{showIcon && <Timer className="h-4 w-4" />}
			<span>
				{days > 0 && `${days}d `}
				{hours > 0 && `${hours}h `}
				{minutes > 0 && `${minutes}m `}
				{seconds}s remaining
			</span>
		</div>
	);
};
