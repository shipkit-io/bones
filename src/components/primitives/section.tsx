import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sectionStyles = cva(
	// Base styles that apply to all variants
	"w-full container flex flex-col items-center justify-center",
	{
		variants: {
			variant: {
				default: "gap-2xl mt-lg",
				user: "gap-lg bg-muted/50 rounded-lg p-xl",
				bleed: "max-w-none",
			},
			size: {
				default: "w-full",
				narrow: "max-w-2xl",
				wide: "max-w-4xl",
				full: "w-full",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

export interface SectionProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof sectionStyles> {
	children: React.ReactNode;
}

export const Section = ({
	children,
	variant = "default",
	size = "default",
	className,
	...props
}: SectionProps) => (
	<section className={cn(sectionStyles({ variant, size }), className)} {...props}>
		{children}
	</section>
);

export const SectionBadge = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<Badge
		variant="secondary"
		className={cn("rounded-full px-4 py-1 text-sm inline-flex gap-2", className)}
	>
		{children}
	</Badge>
);

export const SectionHeader = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<h3
		className={cn(
			"font-heading text-balance text-3xl font-semibold tracking-tight sm:text-4xl",
			className
		)}
	>
		{children}
	</h3>
);

export const SectionCopy = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<p className={cn("max-w-2xl text-center text-lg text-muted-foreground", className)}>{children}</p>
);

export const SectionContent = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<div className={cn("flex w-full flex-col items-center justify-center gap-4", className)}>
		{children}
	</div>
);
