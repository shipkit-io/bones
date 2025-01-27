import { routes } from "@/config/routes";
import type { NextAuthConfig } from "next-auth";
import { providers } from "./auth.providers";

// Extend the default session user type
declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			name: string | null;
			email: string | null;
			image: string | null;
			bio: string | null;
			githubUsername: string | null;
			theme?: "light" | "dark" | "system";
			emailNotifications?: boolean;
			emailVerified: Date | null;
		};
	}
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthConfig = {
	debug: process.env.NODE_ENV !== "production",
	providers,
	pages: {
		error: routes.auth.error,
		signIn: routes.auth.signIn,
		signOut: routes.auth.signOut,
	},
	// session: {
	// 	strategy: "database",
	// 	maxAge: 30 * 24 * 60 * 60, // 30 days
	// 	updateAge: 24 * 60 * 60, // 24 hours
	// },
	// cookies: {
	// 	sessionToken: {
	// 		name:
	// 			process.env.NODE_ENV === "production"
	// 				? "__Secure-next-auth.session-token"
	// 				: "next-auth.session-token",
	// 		options: {
	// 			httpOnly: true,
	// 			sameSite: "lax",
	// 			path: "/",
	// 			secure: process.env.NODE_ENV === "production",
	// 		},
	// 	},
	// },
	// callbacks: {
	// 	async signIn({ user, account, profile }) {
	// 		if (!user.id) return false;

	// 		if (account?.provider === "github-verify") {
	// 			console.log("github-verify signIn callback", {
	// 				user,
	// 				account,
	// 				profile,
	// 			});
	// 			// Store the GitHub username but don't actually sign in
	// 			// You might want to store this in a temporary session or return it to the client
	// 			return false; // Prevent actual sign in
	// 		}

	// 		console.log("signIn callback", { user, account, profile });
	// 		// Log the sign in activity
	// 		return await AuthService.logAuthActivity(
	// 			user.id,
	// 			account?.provider ?? "unknown",
	// 			user.email ?? null,
	// 		);
	// 	},
	// 	jwt({ token, user, account, trigger, session }) {
	// 		console.log("jwt callback", { token, user, account, trigger, session });
	// 		// Save user data to the token
	// 		if (user) {
	// 			token.id = user.id;
	// 			token.name = user.name;
	// 			token.bio = user.bio;
	// 			token.githubUsername = user.githubUsername;
	// 			token.theme = user.theme;
	// 			token.emailNotifications = user.emailNotifications;
	// 		}

	// 		// Save GitHub access token
	// 		if (account?.provider === "github") {
	// 			token.githubAccessToken = account.access_token;
	// 		}

	// 		if ("githubUsername" in session) {
	// 			token.githubUsername = session.githubUsername;
	// 		}

	// 		// Handle updates
	// 		if (trigger === "update" && session) {
	// 			if (session.theme) token.theme = session.theme;
	// 			if ("emailNotifications" in session)
	// 				token.emailNotifications = session.emailNotifications;
	// 			if ("name" in session) token.name = session.name;
	// 			if ("bio" in session) token.bio = session.bio;
	// 			if ("githubUsername" in session)
	// 				token.githubUsername = session.githubUsername;
	// 		}
	// 		return token;
	// 	},
	// 	session({ session, token }) {
	// 		if (token) {
	// 			session.user.id = token.id as string;
	// 			session.user.name = token.name as string | null;
	// 			session.user.bio = token.bio as string | null;
	// 			session.user.githubUsername = token.githubUsername as string | null;
	// 			session.user.theme = token.theme as
	// 				| "light"
	// 				| "dark"
	// 				| "system"
	// 				| undefined;
	// 			session.user.emailNotifications = token.emailNotifications as
	// 				| boolean
	// 				| undefined;
	// 		}
	// 		return session;
	// 	},
	// },
} satisfies NextAuthConfig;
