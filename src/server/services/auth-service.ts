import crypto from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { STATUS_CODES } from "@/config/status-codes";
// This service can be imported by Node scripts; avoid importing "server-only" here
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { getPayloadClient, payload } from "@/lib/payload/payload";
import { signInSchema } from "@/lib/schemas/auth";
import { signIn, signOut } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { userService } from "@/server/services/user-service";
import type { User, UserRole } from "@/types/user";

// Define a simplified type for Payload User to avoid import issues
interface PayloadUser {
	id: string | number;
	email: string;
	[key: string]: unknown;
}

interface AuthOptions {
	redirectTo?: string;
	redirect?: boolean;
	protect?: boolean;
	role?: UserRole;
	nextUrl?: string;
	errorCode?: string;
	email?: string;
}

// Constants for password hashing
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
	N: 16384, // CPU/memory cost parameter
	r: 8, // Block size parameter
	p: 1, // Parallelization parameter
} as const;

// Promisify scrypt
const scrypt = promisify<string | Buffer, Buffer, number, crypto.ScryptOptions, Buffer>(
	crypto.scrypt
);

/**
 * Hash a password using scrypt
 * @param password The plain text password to hash
 * @returns A string containing the salt and hash, separated by a colon
 */
async function hashPassword(password: string): Promise<string> {
	const salt = crypto.randomBytes(SALT_LENGTH);
	const derivedKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
	return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a password against a hash
 * @param password The plain text password to verify
 * @param hash The hash to verify against (in format salt:hash)
 * @returns True if the password matches, false otherwise
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	try {
		const parts = storedHash.split(":");
		if (parts.length !== 2) return false;

		// Explicitly type the parts to ensure they are strings
		const saltHex: string = parts[0] ?? "";
		const hashHex: string = parts[1] ?? "";

		// Create buffers from the hex strings
		const salt = Buffer.from(saltHex, "hex");
		const hash = Buffer.from(hashHex, "hex");

		const derivedKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
		return crypto.timingSafeEqual(hash, derivedKey);
	} catch {
		return false;
	}
}

/**
 * Authentication service for handling user authentication and authorization
 *
 * This service ensures synchronization between Payload CMS and Shipkit databases
 * for user-related operations (create, update, delete).
 */
export const AuthService = {
	/**
	 * Generate a consistent ID for use in both Payload CMS and Shipkit databases
	 * @returns A UUID string
	 */
	generateConsistentId(): string {
		return crypto.randomUUID();
	},

	/**
	 * Ensure a user exists in both Payload CMS and Shipkit databases
	 * @param userData User data to ensure exists in both databases
	 * @returns The user object if successful
	 */
	async ensureUserSynchronized(userData: {
		id: string;
		email: string;
		name?: string | null;
		image?: string | null;
	}): Promise<{ id: string; email: string }> {
		const { id, email, name, image } = userData;

		try {
			// Get Payload client
			const payload = await getPayloadClient();

			// Check if user exists in Payload CMS
			let payloadUser: PayloadUser | null = null;

			if (payload) {
				try {
					payloadUser = (await payload.findByID({
						collection: "users",
						id,
					})) as unknown as PayloadUser;
				} catch (error) {
					// User doesn't exist in Payload CMS
					logger.debug(`User ${id} not found in Payload CMS, will create`);
				}
			} else {
				logger.debug("Payload CMS is not available, proceeding without it");
			}

			// Create user in Payload CMS if not exists
			if (!payloadUser && payload) {
				try {
					payloadUser = (await payload.create({
						collection: "users",
						data: {
							// For Payload, we need to handle both string and number IDs
							// Some Payload configurations might expect number IDs
							id: id as any, // Use type assertion to bypass type checking
							email,
							// Generate a random password that won't be used
							// User will need to use "forgot password" to set a real password
							password: crypto.randomBytes(16).toString("hex"),
						},
					})) as unknown as PayloadUser;
					logger.info(`Created user ${id} in Payload CMS`);
				} catch (error) {
					logger.error(`Failed to create user ${id} in Payload CMS:`, error);
					throw new Error("Failed to create user in Payload CMS");
				}
			}

			// Ensure user exists in Shipkit database
			await userService.ensureUserExists({
				id,
				email,
				name: name || email,
				image,
			});
			// logger.info(`Ensured user ${id} exists in Shipkit database`);

			return { id, email };
		} catch (error) {
			logger.error("Error synchronizing user:", error);
			// Attempt cleanup if partial creation occurred
			await this.cleanupPartialUserCreation(id);
			throw error;
		}
	},

	/**
	 * Clean up a partially created user if synchronization fails
	 * @param userId The ID of the user to clean up
	 */
	async cleanupPartialUserCreation(userId: string): Promise<void> {
		try {
			// Get Payload client
			const payload = await getPayloadClient();

			// Try to delete from Payload CMS
			if (payload) {
				try {
					await payload.delete({
						collection: "users",
						id: userId,
					});
					logger.debug(`Cleaned up user ${userId} from Payload CMS`);
				} catch (error) {
					// Ignore if user doesn't exist
					logger.debug(`User ${userId} not found in Payload CMS during cleanup`);
				}
			}

			// Try to delete from Shipkit
			try {
				if (db) {
					await db.delete(users).where(eq(users.id, userId));
					// logger.info(`Cleaned up user ${userId} from Shipkit database`);
				}
			} catch (error) {
				// Ignore if user doesn't exist
				if (!(error instanceof Error && error.message.includes("Record to delete not found"))) {
					logger.warn(`Error cleaning up user ${userId} from Shipkit database:`, error);
				} else {
					logger.debug(`User ${userId} not found in Shipkit database during cleanup`);
				}
			}
		} catch (error) {
			logger.error(`Error during cleanup for user ${userId}:`, error);
		}
	},

	/**
	 * Update a user in both Payload CMS and Shipkit databases
	 * @param userId The ID of the user to update
	 * @param userData The user data to update
	 * @returns The updated user object
	 */
	async updateUserSynchronized(
		userId: string,
		userData: {
			email?: string;
			name?: string;
			image?: string;
		}
	): Promise<{ id: string; email?: string }> {
		try {
			// Update in Payload CMS
			const payloadUpdateData: Record<string, any> = {};
			if (userData.email) payloadUpdateData.email = userData.email;

			const payload = await getPayloadClient();
			if (Object.keys(payloadUpdateData).length > 0 && payload) {
				try {
					await payload.update({
						collection: "users",
						id: userId,
						data: payloadUpdateData,
					});
					// logger.info(`Updated user ${userId} in Payload CMS`);
				} catch (payloadError) {
					logger.warn("Failed to update user in Payload:", payloadError);
				}
			}

			// Update in Shipkit
			const shipkitUpdateData: Record<string, any> = {};
			if (userData.email) shipkitUpdateData.email = userData.email;
			if (userData.name) shipkitUpdateData.name = userData.name;
			if (userData.image) shipkitUpdateData.image = userData.image;

			if (Object.keys(shipkitUpdateData).length > 0 && db) {
				try {
					await db
						.update(users)
						.set({
							...shipkitUpdateData,
							updatedAt: new Date(),
						})
						.where(eq(users.id, userId));
					// logger.info(`Updated user ${userId} in Shipkit database`);
				} catch (error) {
					logger.error(`Failed to update user ${userId} in Shipkit database:`, error);
					throw new Error("Failed to update user in Shipkit database");
				}
			}

			return { id: userId, email: userData.email };
		} catch (error) {
			logger.error(`Error updating user ${userId}:`, error);
			throw error;
		}
	},

	/**
	 * Delete a user from both Payload CMS and Shipkit databases
	 * @param userId The ID of the user to delete
	 */
	async deleteUserSynchronized(userId: string): Promise<void> {
		try {
			// Delete from Payload CMS
			// This should cascade to Shipkit due to the relationship defined in payload.config.ts
			const payload = await getPayloadClient();
			if (payload) {
				try {
					await payload.delete({
						collection: "users",
						id: userId,
					});
					// logger.info(`Deleted user ${userId} from Payload CMS`);
				} catch (payloadError) {
					logger.warn("Failed to delete user from Payload:", payloadError);
				}
			}

			// Verify deletion from Shipkit
			// This should happen automatically due to CASCADE, but we check to be sure
			if (db) {
				const shipkitUser = await db.query.users.findFirst({
					where: eq(users.id, userId),
				});

				if (shipkitUser) {
					logger.warn(
						`User ${userId} still exists in Shipkit after Payload deletion, forcing delete`
					);
					await db.delete(users).where(eq(users.id, userId));
				}
			}

			// logger.info(`Successfully deleted user ${userId} from both databases`);
		} catch (error) {
			logger.error(`Error deleting user ${userId}:`, error);
			throw error;
		}
	},

	/**
	 * Sign in with OAuth provider
	 */
	async signInWithOAuth(providerId: string, options?: AuthOptions) {
		await signIn(
			providerId,
			{
				redirectTo: options?.redirectTo ?? routes.home,
				...options,
			},
			providerId === "resend" && options?.email
				? { email: options.email }
				: { prompt: "select_account" }
		);
		return { ok: true, message: STATUS_CODES.LOGIN.message };
	},

	/**
	 * Sign in with email and password using Payload CMS
	 */
	async signInWithCredentials({
		email,
		password,
		redirect = true,
		redirectTo = routes.home,
	}: {
		email: string;
		password: string;
		redirect?: boolean;
		redirectTo?: string;
	}) {
		try {
			// First validate the credentials against Payload CMS
			// This will throw an error if the credentials are invalid
			const user = await this.validateCredentials({ email, password });

			if (!user) {
				throw new Error(STATUS_CODES.CREDENTIALS.message);
			}

			// Use NextAuth's signIn method with credentials provider
			// This will call the authorize function in the credentials provider
			// which uses our validateCredentials method that connects to Payload CMS
			if (redirect) {
				// When redirect is true, NextAuth performs a redirect and interrupts execution.
				// We call and let it redirect; the return below is a fallback for environments
				// where redirect may not hard-stop execution (e.g., tests).
				await signIn("credentials", {
					email,
					password,
					redirect: true,
					callbackUrl: redirectTo,
				});
				return { ok: true, url: redirectTo };
			}

			// Handle non-redirect flow by evaluating the signIn result
			const result = (await signIn("credentials", {
				email,
				password,
				redirect: false,
				callbackUrl: redirectTo,
			})) as any;

			if (!result || result.ok === false) {
				return { ok: false, error: result?.error || STATUS_CODES.CREDENTIALS.message };
			}

			return { ok: true, url: result.url ?? redirectTo };
		} catch (error) {
			// Only log unexpected errors; credential/auth errors are already logged at origin
			if (!(error instanceof Error && (error.message === STATUS_CODES.CREDENTIALS.message || error.message === STATUS_CODES.AUTH_ERROR.message))) {
				logger.error("Error in signInWithCredentials:", error);
			}
			throw error;
		}
	},

	/**
	 * Sign up with email and password using Payload CMS
	 * This method ensures the user is created in both Payload CMS and Shipkit databases
	 */
	async signUpWithCredentials({
		email,
		password,
		redirect = true,
		redirectTo = routes.home,
	}: {
		email: string;
		password: string;
		redirect?: boolean;
		redirectTo?: string;
	}) {
		try {
			if (!payload) {
				logger.error("Payload CMS is not initialized");
				throw new Error("Authentication service unavailable");
			}

			// Check if user already exists in Payload CMS
			const existingUsers = await payload.find({
				collection: "users",
				where: {
					email: {
						equals: email,
					},
				},
			});

			if (existingUsers.docs.length > 0) {
				throw new Error("User already exists with this email");
			}

			// Generate a consistent ID for both databases
			const userId = this.generateConsistentId();
			// logger.info(`Generated consistent ID ${userId} for new user`);

			// Create new user in Payload CMS with the consistent ID
			const newUser = await payload.create({
				collection: "users",
				data: {
					// For Payload, we need to handle both string and number IDs
					// Some Payload configurations might expect number IDs
					id: userId as any, // Use type assertion to bypass type checking
					email,
					password,
				},
			});

			if (!newUser) {
				throw new Error("Failed to create Payload CMS user");
			}

			logger.debug(`Created user in Payload CMS with ID ${userId}`);

			// Create the user in the Shipkit database with the same ID
			await userService.ensureUserExists({
				id: userId, // Use the consistent ID
				email: newUser.email,
				name: newUser.email, // Use email as name initially
				image: null,
			});

			logger.debug(`Created user in Shipkit database with ID ${userId}`);

			// Sign in the user
			if (redirect) {
				// Redirecting flow: let NextAuth redirect and provide a fallback return
				await signIn("credentials", {
					email,
					password,
					redirect: true,
					callbackUrl: redirectTo,
				});
				return { ok: true, user: newUser };
			}

			// Non-redirect flow: evaluate the result
			const result = (await signIn("credentials", {
				email,
				password,
				redirect: false,
				callbackUrl: redirectTo,
			})) as any;

			if (!result || result.ok === false) {
				return { ok: false, error: result?.error || "Sign-up failed" };
			}

			return { ok: true, user: newUser };
		} catch (error) {
			logger.error("Sign up error:", error);
			// If we have a userId, attempt cleanup
			if (error instanceof Error && error.message.includes("ID")) {
				const match = /ID\s+(\S+)/.exec(error.message);
				if (match?.[1]) {
					// Use optional chaining
					await this.cleanupPartialUserCreation(match[1]);
				}
			}
			throw error;
		}
	},

	/**
	 * Sign out the current user
	 */
	async signOut(options?: AuthOptions) {
		await signOut({
			redirectTo: `${routes.home}?${SEARCH_PARAM_KEYS.statusCode}=${STATUS_CODES.LOGOUT.code}`,
			redirect: true,
			...options,
		});

		return { ok: true, message: STATUS_CODES.LOGOUT.message };
	},

	/**
	 * Update the NextAuth session with new data
	 * This is useful for keeping the NextAuth session in sync with Payload CMS
	 * @param options Options for updating the session
	 * @returns The updated session
	 */
	async updateSession({ userId, data }: { userId: string; data: Record<string, any> }) {
		try {
			// Import the update function from auth.ts
			const { update } = await import("@/server/auth");

			// Update the session with the new data
			const updatedSession = await update({
				user: {
					id: userId,
					...data,
				},
			});

			logger.debug(`Updated session for user ${userId} with new data`);
			return updatedSession;
		} catch (error) {
			logger.error(`Error updating session for user ${userId}:`, error);
			throw error;
		}
	},

	/**
	 * Initiate the forgot password process
	 * @param email Email of the user who forgot their password
	 * @returns Success object or throws an error
	 */
	async forgotPassword(email: string): Promise<{ ok: true }> {
		try {
			// Validate email exists in Payload CMS first
			if (!payload) {
				logger.error("Payload CMS is not initialized");
				throw new Error("Authentication service unavailable");
			}

			// Check if the user exists in Payload CMS
			const existingUsers = await payload.find({
				collection: "users",
				where: {
					email: {
						equals: email,
					},
				},
			});

			if (existingUsers.docs.length === 0) {
				logger.warn(`No user found with email: ${email}`);
				// Return success even when the email doesn't exist to prevent email enumeration
				return { ok: true };
			}

			// Call Payload forgotPassword method
			await payload.forgotPassword({
				collection: "users",
				data: {
					email,
				},
			});

			logger.debug(`Password reset email sent to ${email}`);
			return { ok: true };
		} catch (error) {
			logger.error("Error in forgotPassword:", error);
			throw error;
		}
	},

	/**
	 * Reset password using Payload CMS
	 * @param token Reset password token
	 * @param password New password
	 * @returns Success object or throws an error
	 */
	async resetPassword(token: string, password: string): Promise<{ ok: true }> {
		try {
			if (!payload) {
				logger.error("Payload CMS is not initialized");
				throw new Error("Authentication service unavailable");
			}

			// Call Payload resetPassword method
			await payload.resetPassword({
				collection: "users",
				data: {
					token,
					password,
				},
				overrideAccess: true,
			});

			// logger.info("Password reset successful");
			return { ok: true };
		} catch (error) {
			logger.error("Error in resetPassword:", error);
			throw error;
		}
	},

	/**
	 * Validate user credentials against Payload CMS
	 * This method ensures the user exists in the Shipkit database after successful authentication
	 */
	async validateCredentials(credentials: unknown) {
		try {
			// Log the credentials for debugging (excluding password)
			if (credentials && typeof credentials === "object") {
				logger.debug("Validating credentials:", {
					...(credentials as Record<string, unknown>),
					password: "[REDACTED]",
				});
			} else {
				logger.debug("Invalid credentials format:", typeof credentials);
			}

			const parsedCredentials = signInSchema.safeParse(credentials);

			if (!parsedCredentials.success) {
				logger.error("Validation error:", parsedCredentials.error);
				throw new Error(STATUS_CODES.CREDENTIALS.message);
			}

			const { email, password } = parsedCredentials.data;

			// Use Payload CMS for authentication
			if (!payload) {
				logger.error("Payload CMS is not initialized");
				throw new Error(STATUS_CODES.AUTH_ERROR.message);
			}

			try {
				// First check if the user exists
				const existingUsers = await payload.find({
					collection: "users",
					where: {
						email: {
							equals: email,
						},
					},
				});

				if (existingUsers.docs.length === 0) {
					logger.warn(`No user found with email: ${email}`);
					// Throw a specific error instead of returning null
					throw new Error(STATUS_CODES.CREDENTIALS.message);
				}

				// Attempt to login with Payload CMS
				try {
					const result = await payload.login({
						collection: "users",
						data: {
							email,
							password,
						},
					});

					if (!result?.user) {
						logger.warn(`Invalid password for user: ${email}`);
						throw new Error(STATUS_CODES.CREDENTIALS.message);
					}

					// Create a user object to return to NextAuth
					const user = {
						id: String(result.user.id),
						name: result.user.email,
						email: result.user.email,
						emailVerified: null,
						image: null,
						payloadToken: result.token,
					};

					// Ensure the user exists in the Shipkit database
					await userService.ensureUserExists({
						id: user.id,
						email: user.email,
						name: user.name,
						image: user.image,
					});

					// logger.info("User authenticated successfully:", user.id);
					return user;
				} catch (loginError) {
					throw new Error(STATUS_CODES.CREDENTIALS.message);
				}
			} catch (error) {
				// Re-throw credential errors as-is, wrap unexpected errors
				if (error instanceof Error && error.message === STATUS_CODES.CREDENTIALS.message) {
					throw error;
				}
				logger.error("Authentication error:", error);
				throw new Error(STATUS_CODES.AUTH_ERROR.message);
			}
		} catch (error) {
			// Re-throw known auth errors without logging again
			if (error instanceof Error && (error.message === STATUS_CODES.CREDENTIALS.message || error.message === STATUS_CODES.AUTH_ERROR.message)) {
				throw error;
			}
			logger.error("Unexpected auth error:", error);
			throw error;
		}
	},

	async verifyEmail(token: string): Promise<{ ok: boolean; message: string }> {
		if (!env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED) {
			return { ok: false, message: "Email verification not available" };
		}

		try {
			const payload = await getPayloadClient();
			if (!payload) {
				return { ok: false, message: "Payload not available" };
			}

			// Verify the email token
			await payload.verifyEmail({
				collection: "users",
				token,
			});

			return { ok: true, message: "Email verified successfully" };
		} catch (error) {
			logger.error("Error verifying email:", error);
			return { ok: false, message: "Failed to verify email" };
		}
	},

	async resetPasswordViaCMS(
		token: string,
		password: string
	): Promise<{ ok: boolean; message: string }> {
		if (!env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED) {
			return { ok: false, message: "Password reset not available" };
		}

		try {
			const payload = await getPayloadClient();
			if (!payload) {
				return { ok: false, message: "Payload not available" };
			}

			// Reset the password using Payload CMS
			await payload.resetPassword({
				collection: "users",
				data: { token, password },
				overrideAccess: true,
			});

			return { ok: true, message: "Password reset successful" };
		} catch (error) {
			logger.error("Error resetting password:", error);
			return { ok: false, message: "Failed to reset password" };
		}
	},

	async updateUserProfile(
		userId: string,
		updates: Partial<User>
	): Promise<{ ok: boolean; message?: string; user?: User }> {
		try {
			// Get the current user data
			const user = await db?.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				return { ok: false, message: "User not found" };
			}

			// Prepare the data for Payload CMS update
			const payloadUpdateData: Record<string, any> = {};
			if (updates.email) payloadUpdateData.email = updates.email;
			if (updates.name) payloadUpdateData.name = updates.name;

			// Update user in Payload CMS
			const payload = await getPayloadClient();
			if (Object.keys(payloadUpdateData).length > 0 && payload) {
				try {
					await payload.update({
						collection: "users",
						id: user.id,
						data: payloadUpdateData,
					});
				} catch (payloadError) {
					logger.warn("Failed to update user in Payload:", payloadError);
				}
			}

			// Update user in Shipkit database
			if (db) {
				const shipkitUpdateData = { ...updates };
				delete shipkitUpdateData.id; // Don't update the ID
				delete shipkitUpdateData.createdAt; // Don't update creation timestamp

				await db
					.update(users)
					.set({
						...shipkitUpdateData,
						updatedAt: new Date(),
					})
					.where(eq(users.id, userId));
			}

			// Get the updated user data
			const updatedUser = await db?.query.users.findFirst({
				where: eq(users.id, userId),
			});

			return {
				ok: true,
				message: "Profile updated successfully",
				user: updatedUser as User,
			};
		} catch (error) {
			logger.error("Error updating user profile:", error);
			return { ok: false, message: "Failed to update user profile" };
		}
	},

	async deleteUserAccount(userId: string): Promise<{ ok: boolean; message?: string }> {
		try {
			// Check if the user exists
			const user = await db?.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				return { ok: false, message: "User not found" };
			}

			// Delete from Payload CMS
			const payload = await getPayloadClient();
			if (payload) {
				try {
					await payload.delete({
						collection: "users",
						id: userId,
					});
				} catch (payloadError) {
					logger.warn("Failed to delete user from Payload:", payloadError);
				}
			}

			// Delete from Shipkit database
			if (db) {
				await db.delete(users).where(eq(users.id, userId));
			}

			return { ok: true, message: "Account deleted successfully" };
		} catch (error) {
			logger.error("Error deleting user account:", error);
			return { ok: false, message: "Failed to delete user account" };
		}
	},

	async createUserViaCMS(userData: {
		email: string;
		password: string;
		name?: string;
	}): Promise<{ user?: any; error?: string }> {
		const payload = await getPayloadClient();
		if (!payload) {
			return { error: "Payload not available" };
		}

		try {
			// Check if user already exists
			const existingUsers = await payload.find({
				collection: "users",
				where: { email: { equals: userData.email } },
			});

			if (existingUsers.docs.length > 0) {
				return { error: "User with this email already exists" };
			}

			// Generate a consistent ID for the new user
			const userId = this.generateConsistentId();

			// Create user in Payload CMS
			const newUser = await payload.create({
				collection: "users",
				data: {
					id: userId as any,
					email: userData.email,
					password: userData.password,
				},
			});

			if (!newUser) {
				return { error: "Failed to create user" };
			}

			// Create user in Shipkit database
			await userService.ensureUserExists({
				id: userId,
				email: userData.email,
				name: userData.name || userData.email,
				image: null,
			});

			return { user: newUser };
		} catch (error) {
			logger.error("Error creating user via CMS:", error);
			return { error: "Failed to create user" };
		}
	},

	async forgotPasswordViaCMS(email: string): Promise<{ ok: boolean; message: string }> {
		const payload = await getPayloadClient();
		if (!payload) {
			return { ok: false, message: "Password reset not available" };
		}

		try {
			// Check if user exists
			const existingUsers = await payload.find({
				collection: "users",
				where: { email: { equals: email } },
			});

			if (existingUsers.docs.length === 0) {
				// Return success even when user doesn't exist to prevent email enumeration
				return {
					ok: true,
					message: "Password reset email sent if account exists",
				};
			}

			// Send password reset email
			await payload.forgotPassword({
				collection: "users",
				data: { email },
			});

			return { ok: true, message: "Password reset email sent" };
		} catch (error) {
			logger.error("Error initiating password reset:", error);
			// Return generic message for security
			return { ok: false, message: "An error occurred" };
		}
	},

	async resetPasswordViaCMS2(
		token: string,
		password: string
	): Promise<{ ok: boolean; message: string }> {
		const payload = await getPayloadClient();
		if (!payload) {
			return { ok: false, message: "Password reset not available" };
		}

		try {
			await payload.resetPassword({
				collection: "users",
				data: { token, password },
				overrideAccess: true,
			});

			return { ok: true, message: "Password reset successful" };
		} catch (error) {
			logger.error("Error resetting password:", error);
			return { ok: false, message: "Invalid or expired token" };
		}
	},

	async signInViaCMS(email: string, password: string): Promise<{ user?: any; error?: string }> {
		const payload = await getPayloadClient();
		if (!payload) {
			return { error: "Authentication not available" };
		}

		try {
			// Check if user exists first
			const existingUsers = await payload.find({
				collection: "users",
				where: { email: { equals: email } },
				limit: 1,
			});

			if (!existingUsers.docs.length) {
				return { error: "Invalid credentials" };
			}

			// If user exists, try to log in
			try {
				const result = await payload.login({
					collection: "users",
					data: { email, password },
				});

				// Create a user object to return
				const user = {
					id: String(result.user.id),
					name: result.user.email,
					email: result.user.email,
					token: result.token,
				};

				// Ensure the user exists in the Shipkit database
				await userService.ensureUserExists({
					id: user.id,
					email: user.email,
					name: user.name,
					image: null,
				});

				return { user };
			} catch (loginError) {
				logger.warn("Login failed:", loginError);
				return { error: "Invalid credentials" };
			}
		} catch (error) {
			logger.error("Authentication error:", error);
			return { error: "Authentication error" };
		}
	},
} as const;
