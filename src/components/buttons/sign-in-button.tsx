"use client";

import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type React from "react";
import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { useSignInRedirectUrl, useSignOutRedirectUrl } from "@/hooks/use-auth-redirect";
import { cn } from "@/lib/utils";

export const SignInButton = ({
	className,
	children,
	size = "default",
	variant = "link",
	nextUrl,
	showSignOut = true,
	onSignOut,
}: {
	className?: string;
	children?: React.ReactNode;
	size?: "default" | "sm" | "lg" | "icon";
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	nextUrl?: string;
	showSignOut?: boolean;
	onSignOut?: () => void;
}) => {
	const { data: session, status } = useSession();
	const pathname = usePathname();
	const signInRedirectUrl = useSignInRedirectUrl();
	const signOutRedirectUrl = useSignOutRedirectUrl();

	const isAuthenticated = status === "authenticated" && session?.user;
	const isLoading = status === "loading";

	const handleSignOut = async () => {
		if (onSignOut) {
			onSignOut();
		}
		await signOut({
			callbackUrl: nextUrl || routes.home,
			redirect: true,
		});
	};

	// Loading state
	if (isLoading) {
		return (
			<Button variant={variant} size={size} className={cn(className)} disabled>
				Loading...
			</Button>
		);
	}

	// Authenticated state - show sign out button
	if (isAuthenticated && showSignOut) {
		return (
			<Button variant={variant} size={size} className={cn(className)} onClick={handleSignOut}>
				{children || "Sign Out"}
			</Button>
		);
	}

	// Unauthenticated state - show sign in link
	const signInUrl = nextUrl
		? `${routes.auth.signIn}?${SEARCH_PARAM_KEYS.nextUrl}=${nextUrl}`
		: signInRedirectUrl;

	return (
		<Link href={signInUrl} className={cn(buttonVariants({ variant, size }), className)}>
			{children || "Sign In"}
		</Link>
	);
};

export { SignInButton as LoginButton };
