"use client";

import { Link } from "@/components/primitives/link-with-transition";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import type React from "react";

export const LoginButton = ({
	className,
	children = "Login",
}: {
	className?: string;
	children?: React.ReactNode;
}) => {
	const pathname = usePathname();

	return (
		<Link
			href={`${routes.auth.signIn}?${SEARCH_PARAM_KEYS.nextUrl}=${pathname}`}
			className={cn("hover:text-foreground", className)}
		>
			{children}
		</Link>
	);
};
