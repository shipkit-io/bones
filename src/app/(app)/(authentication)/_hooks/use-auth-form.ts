import { useMemo } from "react";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";

export function useAuthForm(mode: "sign-in" | "sign-up", title?: string, description?: string) {
	const isSignIn = mode === "sign-in";

	const cardTitle = useMemo(() => {
		return typeof title === "string"
			? title
			: isSignIn
				? `Welcome to ${siteConfig.title}`
				: "Create an account";
	}, [title, isSignIn]);

	const cardDescription = useMemo(() => {
		return typeof description === "string"
			? description
			: isSignIn
				? "Login to get started"
				: "Sign up to get started";
	}, [description, isSignIn]);

	const alternateLink = useMemo(() => {
		return isSignIn
			? { text: "Don't have an account?", href: routes.auth.signUp, label: "Sign up" }
			: { text: "Already have an account?", href: routes.auth.signIn, label: "Sign in" };
	}, [isSignIn]);

	const isGuestOnlyMode =
		!!env.NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED && !env.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED;
	const shouldShowAlternateLink = !isGuestOnlyMode && !!env.NEXT_PUBLIC_FEATURE_AUTH_ENABLED;
	const hasAnyAuthEnabled = env.NEXT_PUBLIC_FEATURE_AUTH_ENABLED;
	const showAuthUnavailable = !isGuestOnlyMode && !hasAnyAuthEnabled;

	return {
		cardTitle,
		cardDescription,
		alternateLink,
		shouldShowAlternateLink,
		showAuthUnavailable,
	};
}
