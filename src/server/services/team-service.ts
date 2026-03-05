import { and, eq } from "drizzle-orm";
import type { TeamData } from "@/components/providers/team-provider";
import { routes } from "@/config/routes";
import { STATUS_CODES } from "@/config/status-codes";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { teamMembers, teams, users } from "@/server/db/schema";
import type { TeamType } from "@/types/team";
import { BaseService } from "./base-service";
import { ErrorService } from "./error-service";

export class TeamService extends BaseService<typeof teams> {
	constructor() {
		super({
			table: teams,
			idField: "id",
			softDelete: true,
		});
	}

	/**
	 * Creates a personal team for a user.
	 * @param userId - The ID of the user.
	 * @returns The created personal team with its members.
	 */
	async createPersonalTeam(userId: string) {
		if (!db) {
			logger.error("Database not initialized", { userId });
			return null;
		}
		try {
			logger.debug("Creating personal team for user", { userId });

			if (!db) {
				logger.error("Database not initialized", { userId });
				return null;
			}

			// First check if user exists
			const user = await db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				logger.warn("Cannot create personal team: user not found. Signing out user.", { userId });

				// Since session appears to be corrupted, sign the user out silently
				try {
					const { signOut } = await import("@/server/auth");
					await signOut({
						redirectTo: `${routes.auth.signIn}?code=${STATUS_CODES.AUTH_REFRESH.code}`,
					});
				} catch (signOutError) {
					logger.warn("Failed to sign out user with invalid session", {
						userId,
						error: signOutError instanceof Error ? signOutError.message : String(signOutError),
					});
				}

				return null;
			}

			const teamId = crypto.randomUUID();
			const memberId = crypto.randomUUID();

			// Use transaction to create team and member, then return the data directly
			const result = await db.transaction(async (tx) => {
				// Create team
				const [createdTeam] = await tx
					.insert(teams)
					.values({
						id: teamId,
						name: "Personal",
						type: "personal",
					})
					.returning();

				// Create team member
				const [createdMember] = await tx
					.insert(teamMembers)
					.values({
						id: memberId,
						teamId,
						userId,
						role: "owner",
					})
					.returning();

				// Get the user data to construct the complete response
				const user = await tx.query.users.findFirst({
					where: eq(users.id, userId),
				});

				if (!user) {
					throw new Error("User not found during team creation");
				}

				// Return the complete team data with members
				return {
					...createdTeam,
					members: [
						{
							...createdMember,
							user: user,
						},
					],
				};
			});

			logger.debug("Created personal team", { userId, teamId });
			return result;
		} catch (error) {
			logger.error("Error creating personal team", {
				userId,
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Gets all personal teams for a user.
	 * @param userId - The ID of the user.
	 * @returns Array of personal teams.
	 */
	private async getAllPersonalTeams(userId: string) {
		if (!db) {
			logger.error("Database not initialized", { userId });
			return [];
		}
		try {
			if (!db) {
				logger.debug("Database not initialized when getting personal teams", {
					userId,
				});
				return [];
			}

			const personalTeams = await db.query.teamMembers.findMany({
				where: eq(teamMembers.userId, userId),
				with: {
					team: true,
				},
			});

			return (personalTeams || [])
				.filter((tm) => tm.team && tm.team.type === "personal" && !tm.team.deletedAt)
				.map((tm) => tm.team);
		} catch (error) {
			logger.error("Error getting personal teams", {
				userId,
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	/**
	 * Ensures a user has exactly one personal team.
	 * If multiple personal teams exist, keeps the oldest one and soft deletes the rest.
	 * If no personal team exists, creates one.
	 * @param userId - The ID of the user.
	 * @returns The user's personal team.
	 */
	async ensureOnePersonalTeam(userId: string) {
		if (!db) {
			logger.error("Database not initialized", { userId });
			return null;
		}
		try {
			const personalTeams = await this.getAllPersonalTeams(userId);

			if (!personalTeams || personalTeams.length === 0) {
				// No personal team exists, create one
				return this.createPersonalTeam(userId);
			}

			if (personalTeams.length === 1) {
				// Already has exactly one personal team
				return personalTeams[0];
			}

			// Multiple personal teams found, keep the oldest one and soft delete the rest
			const [oldestTeam, ...teamsToDelete] = personalTeams.sort(
				(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
			);

			// Soft delete extra personal teams
			await Promise.all(
				teamsToDelete.map((team) =>
					db!.update(teams).set({ deletedAt: new Date() }).where(eq(teams.id, team.id))
				)
			);

			return oldestTeam;
		} catch (error) {
			logger.error("Error ensuring one personal team", {
				userId,
				error: error instanceof Error ? error.message : String(error),
			});
			// Return null when we can't ensure a personal team
			return null;
		}
	}

	/**
	 * Gets a user's personal team.
	 * @param userId - The ID of the user.
	 * @returns The user's personal team or null if not found.
	 */
	async getPersonalTeam(userId: string) {
		if (!db) {
			logger.error("Database not initialized", { userId });
			return null;
		}
		try {
			// First ensure the user has exactly one personal team
			const personalTeam = await this.ensureOnePersonalTeam(userId);

			if (!personalTeam || !db) {
				return null;
			}

			// Get the full team details with members
			return db.query.teams.findFirst({
				where: personalTeam.id ? eq(teams.id, personalTeam.id) : undefined,
				with: {
					members: {
						with: {
							user: true,
						},
					},
				},
			});
		} catch (error) {
			logger.error("Error getting personal team", {
				userId,
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Creates a new team and assigns the user as the owner.
	 * @param userId - The ID of the user.
	 * @param teamName - The name of the team.
	 * @returns The created team with its members.
	 */
	async createTeam(userId: string, teamName: string) {
		if (!db) {
			logger.error("Database not initialized", { userId });
			return null;
		}
		const teamId = crypto.randomUUID();
		const memberId = crypto.randomUUID();

		// Use transaction to create team and member, then return the data directly
		const result = await db.transaction(async (tx) => {
			// Create team
			const [createdTeam] = await tx
				.insert(teams)
				.values({
					id: teamId,
					name: teamName,
					type: "workspace",
				})
				.returning();

			// Create team member
			const [createdMember] = await tx
				.insert(teamMembers)
				.values({
					id: memberId,
					userId: userId,
					teamId: teamId,
					role: "owner",
				})
				.returning();

			// Get the user data to construct the complete response
			const user = await tx.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				throw new Error("User not found during team creation");
			}

			// Return the complete team data with members
			return {
				...createdTeam,
				members: [
					{
						...createdMember,
						user: user,
					},
				],
			};
		});

		return result;
	}

	/**
	 * Gets all teams for a user.
	 * @param userId - The ID of the user.
	 * @returns The user's teams with their details.
	 */
	async getUserTeams(
		userId: string
	): Promise<{ team: TeamData & { type: TeamType }; role: string }[]> {
		if (!db) {
			logger.error("Database not initialized", { userId });
			return [];
		}
		try {
			// First ensure the user has exactly one personal team
			await this.ensureOnePersonalTeam(userId);

			if (!db) {
				logger.error("Database not initialized", { userId });
				return [];
			}

			const userTeams = await db.query.teamMembers.findMany({
				where: eq(teamMembers.userId, userId),
				with: {
					team: true,
					user: true,
				},
			});

			// Filter out deleted teams and map to the required format
			return (userTeams || [])
				.filter((ut) => ut.team && ut.team.deletedAt === null)
				.map(({ team, role }) => ({
					team: { ...team, type: team.type },
					role,
				}))
				.sort((a, b) => {
					// Always put personal team first
					if (a.team.type === "personal") return -1;
					if (b.team.type === "personal") return 1;
					// Then sort by creation date
					return a.team.createdAt.getTime() - b.team.createdAt.getTime();
				});
		} catch (error) {
			// If there's an error (like a non-existent user or foreign key constraint),
			// log it and return an empty array
			logger.error("Error fetching teams for user", {
				userId,
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	/**
	 * Adds a member to a team.
	 * @param teamId - The ID of the team.
	 * @param userId - The ID of the user to add.
	 * @param role - The role to assign to the user.
	 * @returns The created team member.
	 */
	async addTeamMember(teamId: string, userId: string, role: string) {
		if (!db) {
			logger.error("Database not initialized", { teamId, userId });
			return null;
		}
		const result = await db
			.insert(teamMembers)
			.values({
				id: crypto.randomUUID(),
				teamId,
				userId,
				role,
			})
			.returning();

		return result?.[0];
	}

	/**
	 * Removes a member from a team.
	 * @param teamId - The ID of the team.
	 * @param userId - The ID of the user to remove.
	 * @returns True if removed successfully.
	 */
	async removeTeamMember(teamId: string, userId: string) {
		if (!db) {
			logger.error("Database not initialized", { teamId, userId });
			return false;
		}
		const result = await db
			.delete(teamMembers)
			.where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
			.returning();
		const member = result?.[0];

		return !!member;
	}

	/**
	 * Updates a team member's role.
	 * @param teamId - The ID of the team.
	 * @param userId - The ID of the user.
	 * @param role - The new role to assign.
	 * @returns The updated team member.
	 */
	async updateTeamMemberRole(teamId: string, userId: string, role: string) {
		if (!db) {
			logger.error("Database not initialized", { teamId, userId });
			return null;
		}
		const result = await db
			.update(teamMembers)
			.set({
				role,
			})
			.where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
			.returning();

		return result?.[0];
	}

	/**
	 * Gets all members of a team.
	 * @param teamId - The ID of the team.
	 * @returns The team members with their user details.
	 */
	async getTeamMembers(teamId: string) {
		if (!db) {
			logger.error("Database not initialized", { teamId });
			return [];
		}
		return db.query.teamMembers.findMany({
			where: eq(teamMembers.teamId, teamId),
			with: {
				user: true,
			},
		});
	}

	/**
	 * Updates a team's information.
	 * @param teamId - The ID of the team.
	 * @param data - The data to update.
	 * @returns The updated team with its details.
	 */
	async updateTeam(teamId: string, data: { name?: string }) {
		if (!db) {
			logger.error("Database not initialized", { teamId });
			return null;
		}
		const team = await this.update(teamId, data);

		if (!team) {
			return null;
		}

		return db.query.teams.findFirst({
			where: eq(teams.id, teamId),
			with: {
				members: {
					with: {
						user: true,
					},
				},
			},
		});
	}

	/**
	 * Deletes a team and all associated data.
	 * @param teamId - The ID of the team.
	 * @returns True if deleted successfully.
	 */
	async deleteTeam(teamId: string) {
		if (!db) {
			logger.error("Database not initialized", { teamId });
			return false;
		}
		const team = await db.query.teams.findFirst({
			where: eq(teams.id, teamId),
		});

		if (!team) {
			throw ErrorService.createError("NOT_FOUND", "Team not found");
		}

		if (team.type === "personal") {
			throw ErrorService.createError("FORBIDDEN", "Cannot delete personal team");
		}

		const result = await db
			.update(teams)
			.set({ deletedAt: new Date() })
			.where(eq(teams.id, teamId))
			.returning();

		return !!result?.[0];
	}

	/**
	 * Ensures a user has a personal team, creating one if it doesn't exist.
	 * @param userId - The ID of the user.
	 * @returns The user's personal team.
	 */
	async ensurePersonalTeam(userId: string) {
		if (!db) {
			logger.error("Database not initialized", { userId });
			return null;
		}
		const personalTeam = await this.getPersonalTeam(userId);
		if (!personalTeam) {
			return this.createPersonalTeam(userId);
		}
		return personalTeam;
	}

	/**
	 * Finds a team by ID and includes its members.
	 * @param teamId - The ID of the team.
	 * @returns The team with its members or null if not found.
	 */
	private async findByIdWithMembers(teamId: string) {
		try {
			if (!db) {
				logger.error("Database not initialized when finding team with members", { teamId });
				return null;
			}

			return db.query.teams.findFirst({
				where: eq(teams.id, teamId),
				with: {
					members: {
						with: {
							user: true,
						},
					},
				},
			});
		} catch (error) {
			logger.error("Error finding team with members", {
				teamId,
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}
}
// Export a singleton instance
export const teamService = new TeamService();
