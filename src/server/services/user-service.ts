import { db } from "@/server/db";
import { projectMembers, teamMembers, users } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { BaseService } from "./base-service";
import { teamService } from "./team-service";

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
	 * @param authUser - The authenticated user object.
	 * @returns The database user object.
	 */
	async ensureUserExists(authUser: {
		id: string;
		email: string;
		name?: string | null;
		image?: string | null;
	}) {
		let dbUser = await db.query.users.findFirst({
			where: eq(users.id, authUser.id),
		});

		if (!dbUser) {
			if (!authUser.email) {
				throw new Error("User does not have a primary email");
			}

			const [newUser] = await db
				.insert(users)
				.values({
					id: authUser.id,
					email: authUser.email,
					name: authUser.name ?? null,
					image: authUser.image ?? null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			if (newUser) {
				// Create personal team for new user
				await this.createPersonalTeam(newUser.id);
				dbUser = newUser;
			} else {
				throw new Error(`Failed to create user: ${authUser.id}`);
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
		return db.query.users.findFirst({
			where: eq(users.email, email),
		});
	}

	/**
	 * Gets a user with all their associations.
	 * @param userId - The ID of the user.
	 * @returns The user with their teams and projects.
	 */
	async getUserWithAssociations(userId: string) {
		const user = await db.query.users.findFirst({
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

		return user;
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
		},
	) {
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
		const member = await db.query.teamMembers.findFirst({
			where: and(
				eq(teamMembers.userId, userId),
				eq(teamMembers.teamId, teamId),
			),
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
		const member = await db.query.projectMembers.findFirst({
			where: and(
				eq(projectMembers.userId, userId),
				eq(projectMembers.projectId, projectId),
			),
		});

		return !!member;
	}
}

// Export a singleton instance
export const userService = new UserService();
