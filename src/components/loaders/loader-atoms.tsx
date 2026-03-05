import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/loaders/loader-atoms.module.css";

const loaderVariants = cva("loader", {
	variants: {
		size: {
			default: "w-16 h-16",
			sm: "w-12 h-12",
			lg: "w-20 h-20",
		},
		color: {
			default: "[--loader-color:theme(colors.primary.DEFAULT)]",
			primary: "[--loader-color:theme(colors.primary.DEFAULT)]",
			secondary: "[--loader-color:theme(colors.secondary.DEFAULT)]",
			muted: "[--loader-color:theme(colors.muted.DEFAULT)]",
		},
	},
	defaultVariants: {
		size: "default",
		color: "default",
	},
});

export interface LoaderAtomsProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
		VariantProps<typeof loaderVariants> {
	label?: string;
}

export const LoaderAtoms = React.forwardRef<HTMLDivElement, LoaderAtomsProps>(
	({ className, size, color, label, ...props }, ref) => {
		return (
			<div
				ref={ref}
				aria-live="polite"
				aria-label={label || "Loading"}
				className={cn("relative", className)}
				{...props}
			>
				<div className={cn(loaderVariants({ size, color }), styles.loader)}>
					<div className={cn(styles.inner, styles.one)} />
					<div className={cn(styles.inner, styles.two)} />
					<div className={cn(styles.inner, styles.three)} />
				</div>
				{label && <span className="sr-only">{label}</span>}
			</div>
		);
	}
);
