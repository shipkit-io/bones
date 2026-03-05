"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { LOCAL_STORAGE_KEYS } from "@/config/local-storage-keys";
import { cn } from "@/lib/utils";

const builtByVariants = cva(
	"fixed z-50 flex items-center justify-between text-sm animate-in fade-in-0 transition-opacity duration-500 delay-1000",
	{
		variants: {
			variant: {
				banner: "inset-x-0 bottom-0 p-4 bg-primary text-primary-foreground",
				popover: "bottom-md right-md max-w-sm rounded-lg shadow-lg",
			},
		},
		defaultVariants: {
			variant: "banner",
		},
	}
);

export interface AttributionProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof builtByVariants> {
	title?: string;
	description?: string;
	onClose?: () => void;
	onClick?: () => void;
	open?: boolean;
	href?: string;
}

export function Attribution({
	children,
	className,
	variant = "banner",
	title,
	description,
	open = true,
	href,
	onClick,
	onClose,
	...props
}: AttributionProps) {
	const [wasClosed, setWasClosed] = useLocalStorage(LOCAL_STORAGE_KEYS.attributionClosed, false);
	const [isOpen, setIsOpen] = useState(wasClosed ? false : open);

	const handleClose = () => {
		setIsOpen(false);
		setWasClosed(true);
		onClose?.();
	};

	const Content = () => (
		<>
			{(title || description) && (
				<div>
					{title &&
						(href ? (
							<Link href={href}>
								<h3 className="font-semibold">{title}</h3>
							</Link>
						) : (
							<h3 className="font-semibold">{title}</h3>
						))}
					{description &&
						(href ? (
							<Link href={href}>
								<p className="text-xs">{description}</p>
							</Link>
						) : (
							<p className="text-xs">{description}</p>
						))}
				</div>
			)}
			{onClose && (
				<Button variant="ghost" size="icon" className="shrink-0" onClick={handleClose}>
					<X className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</Button>
			)}
		</>
	);

	if (variant === "banner" && isOpen) {
		return (
			<div className={cn(builtByVariants({ variant }), className)} {...props}>
				<div className="container flex items-center justify-between">
					<Content />
					{children}
					<button onClick={handleClose} type="button" className="absolute top-2 right-2">
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>
		);
	}

	if (variant === "popover" && isOpen) {
		return (
			<Card className={cn(builtByVariants({ variant }), className)} {...props}>
				<button onClick={handleClose} type="button" className="absolute top-2 right-2">
					<X className="h-4 w-4" />
				</button>

				<CardHeader>
					<Content />
				</CardHeader>
				<CardContent className="flex gap-2 justify-end mt-auto">{children}</CardContent>
				<CardFooter className="mt-auto">
					{href && (
						<Link href={href} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
							More...
						</Link>
					)}
				</CardFooter>
			</Card>
		);
	}

	return null;
}
