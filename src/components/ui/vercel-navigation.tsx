"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { Link } from "../primitives/link";

interface NavLink {
	label: string | React.ReactNode;
	href: string;
	icon?: React.ReactNode;
}

const navigationVariants = cva(
	// Base styles
	"flex flex-col sm:flex-row",
	{
		variants: {
			variant: {
				hover: "", // Variant 1 - hover based
				click: "", // Variant 2 - click based
			},
		},
		defaultVariants: {
			variant: "hover",
		},
	}
);

const buttonVariants = cva(
	// Base styles
	"relative z-10 flex w-fit whitespace-nowrap rounded px-2 py-1 font-medium text-sm text-neutral-500",
	{
		variants: {
			variant: {
				hover: "",
				click: "transition-colors hover:text-neutral-600 dark:hover:text-neutral-400",
			},
		},
		defaultVariants: {
			variant: "hover",
		},
	}
);

interface VercelNavigationProps extends VariantProps<typeof navigationVariants> {
	navLinks?: NavLink[];
	className?: string;
}

export const VercelNavigation = ({
	variant = "hover",
	navLinks = [
		{ label: "Home", href: "#" },
		{ label: "About", href: "#" },
		{ label: "Contact", href: "#" },
		{ label: "Terms & conditions", href: "#" },
		{ label: "Cuicui.day", href: "#" },
	],
	className,
}: VercelNavigationProps) => {
	const [elementFocused, setElementFocused] = useState<number | null>(
		variant === "hover" ? null : 0
	);

	const handleInteraction = (index: number | null) => {
		setElementFocused(index);
	};

	return (
		<nav
			className={cn(navigationVariants({ variant }), className)}
			{...(variant === "hover" && {
				onMouseLeave: () => handleInteraction(null),
			})}
		>
			{navLinks.map((link, index) => (
				<Link
					href={link.href}
					className={cn(buttonVariants({ variant }), "items-center justify-center")}
					key={uuidv4()}
					{...(variant === "hover"
						? { onMouseEnter: () => handleInteraction(index) }
						: { onClick: () => handleInteraction(index) })}
				>
					{link.label}
					<AnimatePresence>
						{elementFocused === index && (
							<motion.div
								animate={{ opacity: 1, scale: 1 }}
								className="absolute bottom-0 left-0 right-0 top-0 -z-10 rounded-md bg-neutral-200 dark:bg-neutral-800"
								exit={{ opacity: 0, scale: 0.9 }}
								initial={{ opacity: 0, scale: 0.95 }}
								layout={true}
								layoutId="focused-element"
								transition={{
									duration: variant === "hover" ? 0.2 : 0.3,
									ease: variant === "hover" ? "easeOut" : "easeInOut",
								}}
							/>
						)}
					</AnimatePresence>
				</Link>
			))}
		</nav>
	);
};

export default VercelNavigation;
