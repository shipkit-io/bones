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

// Add the CSS animation
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .attribution-animate {
    opacity: 0;
    animation: fadeIn 0.4s ease-in-out forwards;
    animation-delay: 10s;
  }
`;

const builtByVariants = cva(
	"fixed z-50 flex items-center justify-between text-sm attribution-animate",
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
	heading?: React.ReactNode;
	description?: React.ReactNode;
	onClose?: () => void;
	onClick?: () => void;
	open?: boolean;
	href?: string;
}

export function Attribution({
	children,
	className,
	variant = "banner",
	heading,
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

	// Don't render if there's no meaningful content
	if (!heading && !description && !children) {
		return null;
	}

	const _Content = () => (
		<>
			{(heading || description) && (
				<div className="">
					{heading &&
						(href ? (
							<Link href={href}>
								<h3 className="font-semibold">{heading}</h3>
							</Link>
						) : (
							<h3 className="font-semibold">{heading}</h3>
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
			<>
				<style>{styles}</style>
				<div className={cn(builtByVariants({ variant }), className)} {...props}>
					<div className="container flex items-center justify-between gap-2">
						{(heading || description) && (
							<div>
								{heading &&
									(href ? (
										<Link href={href}>
											<h3 className="font-semibold">{heading}</h3>
										</Link>
									) : (
										<h3 className="font-semibold">{heading}</h3>
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
						{children}
						<button onClick={handleClose} type="button" className="absolute right-1.5 top-1.5">
							<X className="h-4 w-4" />
						</button>
					</div>
				</div>
			</>
		);
	}

	if (variant === "popover" && isOpen) {
		return (
			<>
				<style>{styles}</style>
				<Card className={cn(builtByVariants({ variant }), className)} {...props}>
					<CardHeader className="p-3">
						{(heading || description) && (
							<div className="flex flex-col gap-2">
								{heading && <h3 className="font-semibold">{heading}</h3>}
								{description && <p className="text-xs">{description}</p>}
							</div>
						)}
						{onClose && (
							<Button variant="ghost" size="icon" className="shrink-0" onClick={handleClose}>
								<X className="h-4 w-4" />
								<span className="sr-only">Close</span>
							</Button>
						)}
					</CardHeader>
					{children && (
						<CardContent className="mt-auto flex justify-end gap-2 p-3">{children}</CardContent>
					)}
					{href && (
						<CardFooter className="mt-auto p-3">
							<Link
								href={href}
								className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full p-1")}
								onClick={() => onClick?.()}
							>
								Learn more...
							</Link>
						</CardFooter>
					)}

					<button onClick={handleClose} type="button" className="absolute right-1.5 top-1.5">
						<X className="size-3" />
					</button>
				</Card>
			</>
		);
	}

	return null;
}
