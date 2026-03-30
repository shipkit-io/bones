"use client";

import * as React from "react";
import { LoaderAtoms } from "@/components/loaders/loader-atoms";
import { cn } from "@/lib/utils";

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
	/**
	 * The size of the loader indicator
	 */
	size?: "sm" | "default" | "lg";

	/**
	 * The color variant of the loader indicator
	 */
	color?: "default" | "primary" | "secondary" | "muted";

	/**
	 * Whether to show a full-page loader state
	 */
	fullPage?: boolean;

	/**
	 * Custom loader text for accessibility
	 */
	label?: string;

	/**
	 * Whether to show a backdrop behind the loader
	 */
	backdrop?: boolean;

	/**
	 * Whether to fade in the loader indicator
	 * @default false
	 */
	fade?: boolean;
}

/**
 * A loader component that can be used with React Suspense
 *
 * @example
 * ```tsx
 * <Loader fadeIn />
 * // or
 * <Suspense fallback={<Loader fade />}>
 *   <MyComponent />
 * </Suspense>
 * ```
 */
export const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
	(
		{
			className,
			size = "default",
			color = "default",
			fullPage = false,
			label = "Loader...",
			backdrop = true,
			fade = false,
			...props
		},
		ref
	) => {
		return (
			<div
				ref={ref}
				className={cn(
					"grid place-items-center",
					fullPage && "fixed inset-0 z-50 p-4 min-h-screen",
					backdrop && "bg-background/80 backdrop-blur-sm",
					fade && "duration-300 animate-in fade-in",
					className
				)}
				{...props}
			>
				<LoaderAtoms size={size} color={color} label={label} />
			</div>
		);
	}
);
