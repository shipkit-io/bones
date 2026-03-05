import { createAuthClient } from "better-auth/react";
import { BASE_URL } from "@/config/base-url";
import { env } from "@/env";

/**
 * Better Auth client for frontend use
 * @see https://www.better-auth.com/docs/authentication/client
 *
 * This provides hooks and utilities for authentication in React components.
 * Only available when Better Auth is enabled.
 */
export const authClient = createAuthClient({
	baseURL: BASE_URL,
	fetchOptions: {
		onError(e) {
			if (e.error.status === 429) {
				console.warn("Better Auth: Rate limit exceeded");
			}
		},
	},
});

// Export commonly used hooks and methods
export const { useSession, signIn, signUp, signOut, getSession } = authClient;

/**
 * Utility function to check if user is authenticated
 */
export const useIsAuthenticated = () => {
	const { data: session, isPending } = useSession();
	return {
		isAuthenticated: !!session?.user && !isPending,
		isLoading: isPending,
		user: session?.user,
		session,
	};
};

/**
 * Better Auth provider sign-in utilities
 */
export const socialSignIn = {
	google: () => signIn.social({ provider: "google" }),
	github: () => signIn.social({ provider: "github" }),
	discord: () => signIn.social({ provider: "discord" }),
};

/**
 * Email/password authentication utilities
 */
export const emailAuth = {
	signIn: (email: string, password: string) => signIn.email({ email, password }),

	signUp: (email: string, password: string, name: string) =>
		signUp.email({
			email,
			password,
			name,
		}),

	// Note: forgotPassword and resetPassword require the "email-otp" plugin
	// to be enabled in the Better Auth server config
	// forgotPassword: (email: string) => authClient.forgotPassword({ email }),
	// resetPassword: (token: string, newPassword: string) =>
	// 	authClient.resetPassword({ token, newPassword }),
};

/**
 * Two-factor authentication utilities
 */
// export const twoFactorAuth = {
// 	enable: () => authClient.twoFactor.enable(),
// 	disable: () => authClient.twoFactor.disable(),
// 	verify: (code: string) => authClient.twoFactor.verify({ code }),
// };

export type BetterAuthSession = Awaited<ReturnType<typeof getSession>>;
export type BetterAuthUser = BetterAuthSession["user"];
