/**
 * @fileoverview User management service for Shipkit
 * @module server/services/user-service
 *
 * This service handles all user-related operations including:
 * - User creation and management
 * - Team membership and personal team creation
 * - Payment linking and user access control
 * - File management and cleanup
 * - API key management for users
 *
 * Key responsibilities:
 * - Ensure users exist after authentication
 * - Create personal teams for new users
 * - Link existing payments to new user accounts
 * - Manage user data updates and deletions
 * - Handle user file cleanup on account deletion
 *
 * Dependencies:
 * - BaseService: Provides CRUD operations with soft delete
 * - TeamService: For managing user teams
 * - PaymentService: For linking payments to users
 * - ApiKeyService: For managing user API keys
 *
 * @security All operations respect user ownership and team membership
 * @performance Uses database transactions for consistency
 */

import { and, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import type { User } from "@/server/db/schema";
import { projectMembers, teamMembers, userFiles, users } from "@/server/db/schema";
import { apiKeyService } from "./api-key-service";
import { BaseService } from "./base-service";
import { PaymentService } from "./payment-service";
import { deleteFromS3 } from "./s3";
import { teamService } from "./team-service";

/**
 * Service for managing users, their teams, and associated data
 *
 * @extends BaseService<typeof users>
 *
 * @example
 * ```typescript
 * const user = await userService.ensureUserExists({
 *   id: 'user123',
 *   email: 'user@example.com',
 *   name: 'John Doe'
 * });
 * ```
 */
export class UserService extends BaseService<typeof users> {
	constructor() {
		super({
			table: users,
			idField: "id",
			softDelete: true,
		});
	}

	/**
	 * Creates a personal team for a new user.
	 * @param userId - The ID of the user.
	 * @returns The created personal team.
	 */
	private async createPersonalTeam(userId: string) {
		return teamService.createPersonalTeam(userId);
	}

	/**
	 * Ensures a user exists in the database, creating them if necessary.
	 * Users are identified by email - if a user with the email exists, that user is returned.
	 * Also checks and links any existing payments.
	 * @param authUser - The authenticated user object.
	 * @returns The database user object.
	 */
	async ensureUserExists(authUser: {
		id: string;
		email: string;
		name?: string | null;
		image?: string | null;
	}) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		if (!authUser.email) {
			throw new Error("User does not have a primary email");
		}

		// Normalize email for consistent matching
		const normalizedEmail = authUser.email.toLowerCase();

		// First, look up by email (email is the canonical identifier)
		let dbUser = await db.query.users.findFirst({
			where: eq(users.email, normalizedEmail),
		});

		if (!dbUser) {
			// No user with this email - create new user
			const [newUser] = await db
				.insert(users)
				.values({
					id: authUser.id,
					email: normalizedEmail,
					name: authUser.name ?? null,
					image: authUser.image ?? null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			if (newUser) {
				// Create personal team for new user
				await this.createPersonalTeam(newUser.id);

				// Check for existing payments
				const hasPaid = await PaymentService.getUserPaymentStatus(newUser.id);
				if (hasPaid) {
					logger.info("Found existing payment for new user", {
						userId: newUser.id,
					});
				}

				dbUser = newUser;
			} else {
				throw new Error(`Failed to create user: ${authUser.id}`);
			}
		} else {
			// Update existing user if profile information has changed
			const needsUpdate =
				(authUser.name !== undefined && authUser.name !== dbUser.name) ||
				(authUser.image !== undefined && authUser.image !== dbUser.image);

			if (needsUpdate) {
				const updateData: Partial<typeof users.$inferInsert> = {
					updatedAt: new Date(),
				};

				if (authUser.name !== undefined && authUser.name !== dbUser.name) {
					updateData.name = authUser.name;
				}

				if (authUser.image !== undefined && authUser.image !== dbUser.image) {
					updateData.image = authUser.image;
				}

				const [updatedUser] = await db
					.update(users)
					.set(updateData)
					.where(eq(users.id, authUser.id))
					.returning();

				if (updatedUser) {
					dbUser = updatedUser;
				}
			}

			// Check for existing payments for existing users too
			const hasPaid = await PaymentService.getUserPaymentStatus(dbUser.id);
			if (hasPaid) {
				logger.info("Found existing payment for existing user", {
					userId: dbUser.id,
				});
			}
		}

		return dbUser;
	}

	/**
	 * Gets all projects associated with a user.
	 * @param userId - The ID of the user.
	 * @returns A list of projects with their details.
	 */
	async getUserProjects(userId: string) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.projectMembers.findMany({
			where: eq(projectMembers.userId, userId),
			with: {
				project: {
					with: {
						team: true,
						members: {
							with: {
								user: true,
							},
						},
					},
				},
			},
		});
	}

	/**
	 * Gets all teams associated with a user.
	 * @param userId - The ID of the user.
	 * @returns A list of teams with their details.
	 */
	async getUserTeams(userId: string) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.teamMembers.findMany({
			where: eq(teamMembers.userId, userId),
			with: {
				team: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
					},
				},
			},
		});
	}

	/**
	 * Gets a user by their email address.
	 * @param email - The email address to look up.
	 * @returns The user if found, null otherwise.
	 */
	async getUserByEmail(email: string) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase()),
		});
	}

	/**
	 * Gets a user with all their associations.
	 * @param userId - The ID of the user.
	 * @returns The user with their teams and projects.
	 */
	async getUserWithAssociations(userId: string) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.users.findFirst({
			where: eq(users.id, userId),
			with: {
				teamMembers: {
					with: {
						team: true,
					},
				},
				projectMembers: {
					with: {
						project: {
							with: {
								team: true,
							},
						},
					},
				},
			},
		});
	}

	/**
	 * Updates a user's profile information.
	 * @param userId - The ID of the user.
	 * @param data - The data to update.
	 * @returns The updated user.
	 */
	async updateProfile(
		userId: string,
		data: {
			name?: string | null;
			image?: string | null;
		}
	) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		const user = await this.update(userId, {
			...data,
			updatedAt: new Date(),
		});

		return user;
	}

	/**
	 * Verifies a user's email address.
	 * @param userId - The ID of the user.
	 * @returns The updated user.
	 */
	async verifyEmail(userId: string) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		const user = await this.update(userId, {
			emailVerified: new Date(),
			updatedAt: new Date(),
		});

		return user;
	}

	/**
	 * Gets all users in a team.
	 * @param teamId - The ID of the team.
	 * @returns A list of users with their roles.
	 */
	async getTeamUsers(teamId: string) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.teamMembers.findMany({
			where: eq(teamMembers.teamId, teamId),
			with: {
				user: true,
			},
		});
	}

	/**
	 * Gets all users in a project.
	 * @param projectId - The ID of the project.
	 * @returns A list of users with their roles.
	 */
	async getProjectUsers(projectId: string) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.projectMembers.findMany({
			where: eq(projectMembers.projectId, projectId),
			with: {
				user: true,
			},
		});
	}

	/**
	 * Checks if a user has access to a team.
	 * @param userId - The ID of the user.
	 * @param teamId - The ID of the team.
	 * @returns True if the user has access.
	 */
	async hasTeamAccess(userId: string, teamId: string) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		const member = await db?.query.teamMembers.findFirst({
			where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
		});

		return !!member;
	}

	/**
	 * Checks if a user has access to a project.
	 * @param userId - The ID of the user.
	 * @param projectId - The ID of the project.
	 * @returns True if the user has access.
	 */
	async hasProjectAccess(userId: string, projectId: string) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		const member = await db?.query.projectMembers.findFirst({
			where: and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)),
		});

		return !!member;
	}

	/**
	 * Adds a file to a user's profile
	 * @param userId - The ID of the user
	 * @param file - The file information
	 * @returns The created file record
	 */
	async addUserFile(userId: string, file: { title: string; location: string }) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		const [newFile] = await db
			.insert(userFiles)
			.values({
				userId,
				title: file.title,
				location: file.location,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		logger.info("Added file to user profile", {
			userId,
			fileId: newFile?.id || "",
			title: file.title,
		});

		return newFile;
	}

	/**
	 * Deletes a file from a user's profile
	 * @param userId - The ID of the user
	 * @param fileId - The ID of the file to delete
	 */
	async deleteUserFile(userId: string, fileId: number) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		// First, get the file to check ownership and get the location
		const file = await db.query.userFiles.findFirst({
			where: and(eq(userFiles.id, fileId), eq(userFiles.userId, userId)),
		});

		if (!file) {
			throw new Error("File not found or access denied");
		}

		// Delete from S3 first
		try {
			const fileName = file.location.split("/").pop();
			if (fileName) {
				await deleteFromS3(fileName);
			}
		} catch (error) {
			logger.error("Failed to delete file from S3", {
				error,
				fileId,
				location: file.location,
			});
			// Continue with database deletion even if S3 deletion fails
		}

		// Delete from database
		await db.delete(userFiles).where(and(eq(userFiles.id, fileId), eq(userFiles.userId, userId)));

		logger.info("Deleted file from user profile", {
			userId,
			fileId,
		});
	}

	/**
	 * Finds a user by email or creates one if they don't exist.
	 * Intended for use cases like payment imports where only email is known initially.
	 * Uses database transactions to prevent race conditions.
	 * @param email - The email address to find or create.
	 * @param userData - Optional data for creating a new user (e.g., name).
	 * @returns An object containing the user and a boolean indicating if the user was created.
	 */
	async findOrCreateUserByEmail(
		email: string,
		userData?: { name?: string | null; image?: string | null }
	): Promise<{ user: User; created: boolean }> {
		if (!db) {
			throw new Error("Database is not initialized");
		}
		if (!email) {
			throw new Error("Email is required to find or create a user.");
		}

		// Normalize email to lowercase for consistent matching
		const normalizedEmail = email.toLowerCase();

		// Use a transaction to prevent race conditions
		return await db
			.transaction(async (tx) => {
				// First, try to find the user within the transaction
				let user = await tx.query.users.findFirst({
					where: eq(users.email, normalizedEmail),
				});

				if (user) {
					logger.debug("Found existing user by email.", {
						email: normalizedEmail,
						userId: user.id,
					});
					return { user, created: false };
				}

				// User doesn't exist, create a new one
				logger.info("User not found by email, creating new user.", { email: normalizedEmail });
				const newUserId = crypto.randomUUID();

				const [newUserRecord] = await tx
					.insert(users)
					.values({
						id: newUserId,
						email: normalizedEmail,
						name: userData?.name ?? null,
						image: userData?.image ?? null,
						createdAt: new Date(),
						updatedAt: new Date(),
						// emailVerified might need specific handling depending on requirements
					})
					.returning();

				if (!newUserRecord) {
					throw new Error(`Failed to create user with email: ${normalizedEmail}`);
				}

				user = newUserRecord;

				// Create personal team for the new user within the transaction
				try {
					await this.createPersonalTeam(user.id);
				} catch (error) {
					logger.error("Failed to create personal team for new user", {
						userId: user.id,
						email: normalizedEmail,
						error: error instanceof Error ? error.message : String(error),
					});
					// Don't fail the user creation if team creation fails
				}

				// Create default API key (outside transaction since it's not critical)
				// We'll do this after the transaction completes

				return { user, created: true };
			})
			.then(async (result) => {
				// Create default API key outside the transaction
				if (result.created) {
					try {
						const apiKey = await apiKeyService.createApiKey({
							userId: result.user.id,
							name: "Default API Key",
							description: "Created automatically during import/creation",
						});
						logger.info("Created default API key for newly created user", {
							userId: result.user.id,
							apiKeyId: apiKey?.id || "",
						});
					} catch (error) {
						logger.error("Failed to create default API key for new user", {
							userId: result.user.id,
							error: error instanceof Error ? error.message : String(error),
						});
						// Don't fail the user creation if API key creation fails
					}
				}

				return result;
			});
	}
}

// Export a singleton instance
export const userService = new UserService();
