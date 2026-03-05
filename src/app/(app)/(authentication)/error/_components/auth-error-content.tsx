"use client";

import { useSearchParams } from "next/navigation";
import { Boundary } from "@/components/primitives/boundary";
import { routes } from "@/config/routes";

// NextAuth error types + custom OAuth errors
enum AuthError {
	Configuration = "Configuration",
	AccessDenied = "AccessDenied",
	Verification = "Verification",
	OAuthSignin = "OAuthSignin",
	OAuthCallback = "OAuthCallback",
	OAuthCreateAccount = "OAuthCreateAccount",
	EmailCreateAccount = "EmailCreateAccount",
	Callback = "Callback",
	OAuthAccountNotLinked = "OAuthAccountNotLinked",
	EmailSignin = "EmailSignin",
	CredentialsSignin = "CredentialsSignin",
	SessionRequired = "SessionRequired",
	Default = "Default",
}

const errorConfig: Record<
	AuthError,
	{ message: string; action: string; href: string }
> = {
	[AuthError.Configuration]: {
		message:
			"There is a problem with the server configuration. Please contact support.",
		action: "Go home",
		href: routes.home,
	},
	[AuthError.AccessDenied]: {
		message: "You do not have permission to access this resource.",
		action: "Go home",
		href: routes.home,
	},
	[AuthError.Verification]: {
		message: "The verification link has expired or has already been used.",
		action: "Request new link",
		href: routes.auth.signIn,
	},
	[AuthError.OAuthSignin]: {
		message: "Could not start the sign-in process. Please try again.",
		action: "Try again",
		href: routes.auth.signIn,
	},
	[AuthError.OAuthCallback]: {
		message:
			"Could not complete sign-in. The provider may be experiencing issues.",
		action: "Try again",
		href: routes.auth.signIn,
	},
	[AuthError.OAuthCreateAccount]: {
		message:
			"Could not create your account. Please try a different sign-in method.",
		action: "Try again",
		href: routes.auth.signIn,
	},
	[AuthError.EmailCreateAccount]: {
		message: "Could not create your account with this email.",
		action: "Try again",
		href: routes.auth.signIn,
	},
	[AuthError.Callback]: {
		message: "Something went wrong during authentication.",
		action: "Try again",
		href: routes.auth.signIn,
	},
	[AuthError.OAuthAccountNotLinked]: {
		message:
			"This email is already associated with another account. Please sign in with your original method.",
		action: "Sign in",
		href: routes.auth.signIn,
	},
	[AuthError.EmailSignin]: {
		message: "Could not send the sign-in email. Please try again.",
		action: "Try again",
		href: routes.auth.signIn,
	},
	[AuthError.CredentialsSignin]: {
		message: "Invalid email or password. Please check your credentials.",
		action: "Try again",
		href: routes.auth.signIn,
	},
	[AuthError.SessionRequired]: {
		message: "You must be signed in to access this page.",
		action: "Sign in",
		href: routes.auth.signIn,
	},
	[AuthError.Default]: {
		message: "An unexpected error occurred. Please try again.",
		action: "Try again",
		href: routes.auth.signIn,
	},
};

// Provider display names for user-friendly messages
const providerNames: Record<string, string> = {
	github: "GitHub",
	google: "Google",
	discord: "Discord",
	gitlab: "GitLab",
	twitter: "Twitter",
	bitbucket: "Bitbucket",
	credentials: "email and password",
	email: "email and password",
};

export const AuthErrorContent = () => {
	const searchParams = useSearchParams();
	const error = searchParams?.get("error") as AuthError;
	const provider = searchParams?.get("provider");

	// Get config for this error, fallback to default
	const config = errorConfig[error] || errorConfig[AuthError.Default];

	// Customize message for OAuthAccountNotLinked with provider hint
	let message = config.message;
	if (error === AuthError.OAuthAccountNotLinked && provider) {
		const providerName = providerNames[provider] || provider;
		message = `This email is already associated with an account. Please sign in with ${providerName} instead.`;
	}

	return (
		<Boundary
			title="Authentication Error"
			description={message}
			href={config.href}
			actionText={config.action}
			className="max-w-xl mx-auto"
		>
			{error && (
				<div className="text-xs text-muted-foreground mt-4">
					Error code:{" "}
					<code className="rounded-sm bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-xs">
						{error}
					</code>
				</div>
			)}
		</Boundary>
	);
};
