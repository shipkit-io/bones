"use client";

import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserMenu } from "@/components/ui/user-menu";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useWindowScroll } from "@uidotdev/usehooks";
import { cva } from "class-variance-authority";
import { useSession } from "next-auth/react";
import type React from "react";
import { useMemo } from "react";

import { SearchAi } from "@/components/search/search-ai";
import styles from "@/styles/header.module.css";
import { BoxesIcon } from "lucide-react";
import { BuyButton } from "../buttons/buy-button";

interface NavLink {
	href: string;
	label: string;
	isCurrent?: boolean;
}

interface HeaderProps {
	navLinks?: NavLink[];
	logoHref?: string;
	logoIcon?: React.ReactNode;
	logoText?: string;
	searchPlaceholder?: string;
	variant?: "default" | "sticky" | "floating";
}

const defaultNavLinks = [
	{ href: routes.faq, label: "Faqs", isCurrent: false },
	{ href: routes.features, label: "Features", isCurrent: false },
	{ href: routes.pricing, label: "Pricing", isCurrent: false },
];

const headerVariants = cva(
	"translate-z-0 z-50 p-md",
	{
		variants: {
			variant: {
				default: "relative",
				floating: "sticky top-0 h-24",
				sticky: "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

export const Header: React.FC<HeaderProps> = ({
	logoHref = routes.home,
	logoIcon = <BoxesIcon className="h-5 w-5" />,
	logoText = siteConfig.name,
	navLinks = defaultNavLinks,
	variant = "default",
}) => {
	const [{ y }] = useWindowScroll();
	const isOpaque = useMemo(() => variant === "floating" && y && y > 100, [y, variant]);
	const { data: session } = useSession();

	return (
		<>
			<header
				className={cn(
					headerVariants({ variant }),
					variant === "floating" && styles.header,
					variant === "floating" && isOpaque && styles.opaque,
					variant === "floating" && isOpaque && "-top-[12px] [--background:#fafafc70] dark:[--background:#1c1c2270]",
				)}
			>
				{variant === "floating" && <div className="h-[12px] w-full" />}
				<nav className="container flex items-center justify-between gap-md">
					<div className="hidden flex-col gap-md md:flex md:flex-row md:items-center">
						<Link
							href={logoHref}
							className="flex grow items-center gap-2 text-lg font-semibold md:mr-6 md:text-base"
						>
							{logoIcon}
							<span className="block">{logoText}</span>
							<span className="sr-only">{logoText}</span>
						</Link>
						<SearchAi />
					</div>

					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="shrink-0 md:hidden"
							>
								<HamburgerMenuIcon className="h-5 w-5" />
								<span className="sr-only">Toggle navigation menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left">
							<nav className="grid gap-6 font-medium">
								<Link
									href={logoHref}
									className="flex items-center gap-2 text-lg font-semibold"
								>
									{logoIcon}
									<span className="sr-only">{logoText}</span>
								</Link>
								{navLinks.map((link) => (
									<Link
										key={`${link.href}-${link.label}`}
										href={link.href}
										className={cn(
											"text-muted-foreground hover:text-foreground",
											link.isCurrent ? "text-foreground" : "",
										)}
									>
										{link.label}
									</Link>
								))}
								{!session && (
									<>
										<Link
											href={routes.auth.signIn}
											className={cn(
												buttonVariants({ variant: "default" }),
												"w-full justify-center",
											)}
										>
											Get Shipkit
										</Link>
										<Link
											href={routes.auth.signIn}
											className={cn(
												buttonVariants({ variant: "ghost" }),
												"w-full justify-center",
											)}
										>
											Login
										</Link>
									</>
								)}
								{session && (
									<>
										<Link
											href={routes.docs}
											className={cn(
												"text-muted-foreground hover:text-foreground",
											)}
										>
											Documentation
										</Link>
										<Link
											href={routes.app.dashboard}
											className={cn(
												buttonVariants({ variant: "default" }),
												"w-full justify-center",
											)}
										>
											Dashboard
										</Link>
									</>
								)}
							</nav>
						</SheetContent>
					</Sheet>
					<div className="flex items-center gap-2 md:ml-auto lg:gap-4">
						<div className="hidden items-center justify-between gap-md text-sm md:flex">
							{session && (
								<Link
									key={routes.docs}
									href={routes.docs}
									className={cn(
										"transition-colors text-muted-foreground hover:text-foreground",
									)}
								>
									Documentation
								</Link>
							)}
							{navLinks.map((link) => (
								<Link
									key={`${link.href}-${link.label}`}
									href={link.href}
									className={cn(
										"transition-colors hover:text-foreground",
										link.isCurrent
											? "text-foreground"
											: "text-muted-foreground",
									)}
								>
									{link.label}
								</Link>
							))}
						</div>
						<div className="flex items-center gap-2">
							{session ? (
								<UserMenu size="sm" />
							) : (<>
								<ThemeToggle variant="ghost" size="icon" />
								<TooltipProvider delayDuration={0}>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="relative -m-4 p-4">
												<BuyButton />
											</div>
										</TooltipTrigger>
										<TooltipContent
											side="bottom"
											sideOffset={3}
											className="-mt-3 select-none border-none bg-transparent p-0 text-xs text-muted-foreground shadow-none data-[state=delayed-open]:animate-fadeDown"
										>
											<Link
												href={routes.auth.signIn}
												className="hover:text-foreground"
											>
												or Login
											</Link>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</>
							)}
						</div>
					</div>
				</nav>
			</header>
			{variant === "floating" && <div className="-mt-24" />}
		</>
	);
};
