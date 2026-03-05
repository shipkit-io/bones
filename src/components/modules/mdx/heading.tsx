import React from "react";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/extract-headings";

interface HeadingProps {
	level: 1 | 2 | 3 | 4 | 5 | 6;
	children: React.ReactNode;
	className?: string;
	id?: string;
}

export const Heading = ({ level, children, className, id, ...props }: HeadingProps) => {
	const Component = `h${level}`;

	// Generate ID from children if not provided
	const headingId = id ?? (typeof children === "string" ? slugify(children) : "");

	const baseClasses = {
		1: "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl",
		2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
		3: "scroll-m-20 text-2xl font-semibold tracking-tight",
		4: "scroll-m-20 text-xl font-semibold tracking-tight",
		5: "scroll-m-20 text-lg font-semibold tracking-tight",
		6: "scroll-m-20 text-base font-semibold tracking-tight",
	};

	return React.createElement(
		Component,
		{
			id: headingId,
			className: cn(baseClasses[level], className),
			...props,
		},
		children
	);
};

// Export individual heading components for convenience
export const H1 = ({ children, ...props }: Omit<HeadingProps, "level">) => (
	<Heading level={1} {...props}>
		{children}
	</Heading>
);

export const H2 = ({ children, ...props }: Omit<HeadingProps, "level">) => (
	<Heading level={2} {...props}>
		{children}
	</Heading>
);

export const H3 = ({ children, ...props }: Omit<HeadingProps, "level">) => (
	<Heading level={3} {...props}>
		{children}
	</Heading>
);

export const H4 = ({ children, ...props }: Omit<HeadingProps, "level">) => (
	<Heading level={4} {...props}>
		{children}
	</Heading>
);

export const H5 = ({ children, ...props }: Omit<HeadingProps, "level">) => (
	<Heading level={5} {...props}>
		{children}
	</Heading>
);

export const H6 = ({ children, ...props }: Omit<HeadingProps, "level">) => (
	<Heading level={6} {...props}>
		{children}
	</Heading>
);
