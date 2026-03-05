import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { accounts, users } from "@/server/db/schema";

/**
 * Validates a GitHub token by making a lightweight API call.
 * Returns true if token is valid, false if expired/revoked.
 */
export async function validateGitHubToken(
	accessToken: string,
): Promise<boolean> {
	try {
		const response = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/vnd.github.v3+json",
			},
		});

		if (response.status === 401) {
			console.warn("[validateGitHubToken] Token is invalid or expired");
			return false;
		}

		return response.ok;
	} catch (error) {
		console.error("[validateGitHubToken] Error validating token:", error);
		// Network error - assume token is still valid (don't break UX)
		return true;
	}
}

/**
 * Get GitHub connection status with optional token validation.
 * Use validateToken=true when you need to ensure the token actually works
 * (e.g., before making API calls or on settings page).
 */
export async function getGitHubConnectionStatusWithValidation(
	userId?: string,
	options: { validateToken?: boolean } = {},
): Promise<{
	isConnected: boolean;
	isTokenValid: boolean;
	username: string | null;
	accessToken: string | null;
}> {
	const { isConnected, username, accessToken } =
		await getGitHubConnectionStatus(userId);

	// Skip validation if not connected or not requested
	if (!isConnected || !accessToken || !options.validateToken) {
		return {
			isConnected,
			isTokenValid: isConnected, // Assume valid if we're not checking
			username,
			accessToken,
		};
	}

	// Validate the token with GitHub API
	const isTokenValid = await validateGitHubToken(accessToken);

	if (!isTokenValid) {
		console.warn(
			"[getGitHubConnectionStatusWithValidation] Token validation failed",
			{
				userId,
				username,
			},
		);
	}

	return {
		isConnected,
		isTokenValid,
		username,
		accessToken: isTokenValid ? accessToken : null, // Don't return invalid tokens
	};
}

/**
 * Get the GitHub access token for the currently authenticated user
 * @returns The GitHub access token or null if not found
 */
export async function getGitHubAccessToken(
	userId?: string,
): Promise<string | null> {
	try {
		// If no userId provided, get from current session
		if (!userId) {
			const session = await auth();
			if (!session?.user?.id) {
				return null;
			}
			userId = session.user.id;
		}

		// First, try to get the token from the accounts table
		const account = await db?.query.accounts.findFirst({
			where: (accounts, { and, eq }) =>
				and(eq(accounts.userId, userId!), eq(accounts.provider, "github")),
		});

		if (account?.access_token) {
			return account.access_token;
		}

		// Fallback: check user metadata
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (user?.metadata) {
			try {
				const metadata = JSON.parse(user.metadata);
				if (metadata?.providers?.github?.accessToken) {
					return metadata.providers.github.accessToken;
				}
			} catch (error) {
				console.error("Error parsing user metadata:", error);
			}
		}

		return null;
	} catch (error) {
		console.error("Error retrieving GitHub access token:", error);
		return null;
	}
}

/**
 * Get a unified GitHub connection status that ensures isConnected and username are consistent.
 * A connection is only considered valid if we have BOTH an access token AND a username.
 * This prevents UI inconsistencies where isConnected=true but username is null.
 * @returns { isConnected: boolean, username: string | null, accessToken: string | null }
 */
export async function getGitHubConnectionStatus(userId?: string): Promise<{
	isConnected: boolean;
	username: string | null;
	accessToken: string | null;
}> {
	const accessToken = await getGitHubAccessToken(userId);
	const username = await getGitHubUsername(userId);

	// A connection is only valid if we have both a token AND a username
	// If we have a token but no username, something is wrong with the data
	if (accessToken && !username) {
		console.warn(
			"[getGitHubConnectionStatus] Access token exists but no username - data inconsistency",
			{
				userId,
				hasToken: !!accessToken,
			},
		);
	}

	return {
		isConnected: !!(accessToken && username),
		username,
		accessToken,
	};
}

/**
 * Get the GitHub username for the currently authenticated user
 * If the username is not stored but we have a valid access token,
 * fetches it from GitHub API and stores it for future use.
 * @returns The GitHub username or null if not found
 */
export async function getGitHubUsername(
	userId?: string,
): Promise<string | null> {
	try {
		// If no userId provided, get from current session
		if (!userId) {
			const session = await auth();
			if (!session?.user?.id) {
				return null;
			}
			userId = session.user.id;
		}

		// Get the user's GitHub username from database
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (user?.githubUsername) {
			return user.githubUsername;
		}

		// If no username stored but we have an access token, fetch from GitHub API
		const accessToken = await getGitHubAccessToken(userId);
		if (accessToken) {
			try {
				const response = await fetch("https://api.github.com/user", {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						Accept: "application/vnd.github.v3+json",
					},
				});

				if (response.ok) {
					const profile = (await response.json()) as { login?: string };
					const githubUsername = profile.login;

					if (githubUsername) {
						// Store the username for future use
						await db
							?.update(users)
							.set({
								githubUsername,
								updatedAt: new Date(),
							})
							.where(eq(users.id, userId));

						console.info(
							"[getGitHubUsername] Fetched and stored missing GitHub username:",
							{
								userId,
								githubUsername,
							},
						);

						return githubUsername;
					}
				}
			} catch (fetchError) {
				console.error(
					"[getGitHubUsername] Error fetching from GitHub API:",
					fetchError,
				);
			}
		}

		return null;
	} catch (error) {
		console.error("Error retrieving GitHub username:", error);
		return null;
	}
}
