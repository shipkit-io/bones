"use client";

import { Github, Menu } from "lucide-react";
import Link from "next/link";
import { SearchMenu } from "@/components/modules/search/search-menu";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

interface DocsHeaderProps {
	className?: string;
	onToggleNav?: () => void;
}

export function DocsHeader({ className, onToggleNav }: DocsHeaderProps) {
	return (
		<header
			className={cn(
				"sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
				className
			)}
		>
			<div className="container flex h-14 items-center">
				<div className="mr-4 flex md:hidden">
					<Button variant="ghost" size="icon" onClick={onToggleNav}>
						<Menu className="h-5 w-5" />
						<span className="sr-only">Toggle Menu</span>
					</Button>
				</div>
				<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
					<div className="w-full flex-1 md:w-auto md:flex-none">
						<SearchMenu />
					</div>
					<nav className="flex items-center space-x-1">
						<Button variant="ghost" size="icon" asChild>
							<Link href={siteConfig.repo.url} target="_blank" rel="noreferrer">
								<Github className="h-4 w-4" />
								<span className="sr-only">GitHub</span>
							</Link>
						</Button>
					</nav>
				</div>
			</div>
		</header>
	);
}
