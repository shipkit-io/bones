import { LoaderAtoms } from "@/components/ui/loaders/loader-atoms";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
	/**
	 * The size of the loading indicator
	 */
	size?: "sm" | "default" | "lg";

	/**
	 * The color variant of the loading indicator
	 */
	color?: "default" | "primary" | "secondary" | "muted";

	/**
	 * Whether to show a full-page loading state
	 */
	fullPage?: boolean;

	/**
	 * Custom loading text for accessibility
	 */
	label?: string;

	/**
	 * Whether to show a backdrop behind the loader
	 */
	backdrop?: boolean;

	/**
	 * Whether to fade in the loading indicator
	 * @default false
	 */
	fade?: boolean;
}

/**
 * A loading component that can be used with React Suspense
 *
 * @example
 * ```tsx
 * <Loading fadeIn />
 * // or
 * <Suspense fallback={<Loading fadeIn />}>
 *   <MyComponent />
 * </Suspense>
 * ```
 */
export const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
	(
		{
			className,
			size = "default",
			color = "default",
			fullPage = false,
			label = "Loading...",
			backdrop = true,
			fade = false,
			...props
		},
		ref,
	) => {
		return (
			<div
				ref={ref}
				className={cn(
					"flex items-center justify-center",
					fullPage && "fixed inset-0 z-50",
					backdrop && "bg-background/80 backdrop-blur-sm",
					fade && "animate-in fade-in duration-300",
					className,
				)}
				{...props}
			>
				<LoaderAtoms size={size} color={color} label={label} />
			</div>
		);
	},
);
