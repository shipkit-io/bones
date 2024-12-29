import { db } from "@/server/db";
import { teamMembers, teams } from "@/server/db/schema";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
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
		const teamId = crypto.randomUUID();

		await db.transaction(async (tx) => {
			await tx.insert(teams).values({
				id: teamId,
				name: "Personal",
				type: "personal",
			});

			await tx.insert(teamMembers).values({
				id: crypto.randomUUID(),
				teamId,
				userId,
				role: "owner",
			});
		});

		return this.findByIdWithMembers(teamId);
	}

	/**
	 * Gets all personal teams for a user.
	 * @param userId - The ID of the user.
	 * @returns Array of personal teams.
	 */
	private async getAllPersonalTeams(userId: string) {
		const personalTeams = await db.query.teamMembers.findMany({
			where: eq(teamMembers.userId, userId),
			with: {
				team: true,
			},
		});

		return personalTeams
			.filter(
				(tm) => tm.team && tm.team.type === "personal" && !tm.team.deletedAt,
			)
			.map((tm) => tm.team);
	}

	/**
	 * Ensures a user has exactly one personal team.
	 * If multiple personal teams exist, keeps the oldest one and soft deletes the rest.
	 * If no personal team exists, creates one.
	 * @param userId - The ID of the user.
	 * @returns The user's personal team.
	 */
	async ensureOnePersonalTeam(userId: string) {
		const personalTeams = await this.getAllPersonalTeams(userId);

		if (personalTeams.length === 0) {
			// No personal team exists, create one
			return this.createPersonalTeam(userId);
		}

		if (personalTeams.length === 1) {
			// Already has exactly one personal team
			return personalTeams[0];
		}

		// Multiple personal teams found, keep the oldest one and soft delete the rest
		const [oldestTeam, ...teamsToDelete] = personalTeams.sort(
			(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
		);

		// Soft delete extra personal teams
		await Promise.all(
			teamsToDelete.map((team) =>
				db
					.update(teams)
					.set({ deletedAt: new Date() })
					.where(eq(teams.id, team.id)),
			),
		);

		return oldestTeam;
	}

	/**
	 * Gets a user's personal team.
	 * @param userId - The ID of the user.
	 * @returns The user's personal team or null if not found.
	 */
	async getPersonalTeam(userId: string) {
		// First ensure the user has exactly one personal team
		const personalTeam = await this.ensureOnePersonalTeam(userId);

		// Get the full team details with members
		return db.query.teams.findFirst({
			where: eq(teams.id, personalTeam.id),
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
	 * Creates a new team and assigns the user as the owner.
	 * @param userId - The ID of the user.
	 * @param teamName - The name of the team.
	 * @returns The created team with its members.
	 */
	async createTeam(userId: string, teamName: string) {
		const teamId = crypto.randomUUID();

		await db.transaction(async (tx) => {
			await tx.insert(teams).values({
				id: teamId,
				name: teamName,
				type: "workspace",
			});

			await tx.insert(teamMembers).values({
				id: crypto.randomUUID(),
				userId: userId,
				teamId: teamId,
				role: "owner",
			});
		});

		const team = await db.query.teams.findFirst({
			where: eq(teams.id, teamId),
			with: {
				members: {
					with: {
						user: true,
					},
				},
			},
		});

		if (!team) {
			throw new Error("Failed to create team");
		}

		return team;
	}

	/**
	 * Gets all teams for a user.
	 * @param userId - The ID of the user.
	 * @returns The user's teams with their details.
	 */
	async getUserTeams(userId: string) {
		// First ensure the user has exactly one personal team
		await this.ensureOnePersonalTeam(userId);

		const userTeams = await db.query.teamMembers.findMany({
			where: eq(teamMembers.userId, userId),
			with: {
				team: true,
				user: true,
			},
		});

		// Filter out deleted teams and map to the required format
		return userTeams
			.filter((ut) => ut.team && ut.team.deletedAt === null)
			.map(({ team, role }) => ({
				team,
				role,
			}))
			.sort((a, b) => {
				// Always put personal team first
				if (a.team.type === "personal") return -1;
				if (b.team.type === "personal") return 1;
				// Then sort by creation date
				return a.team.createdAt.getTime() - b.team.createdAt.getTime();
			});
	}

	/**
	 * Adds a member to a team.
	 * @param teamId - The ID of the team.
	 * @param userId - The ID of the user to add.
	 * @param role - The role to assign to the user.
	 * @returns The created team member.
	 */
	async addTeamMember(teamId: string, userId: string, role: string) {
		const [member] = await db
			.insert(teamMembers)
			.values({
				id: crypto.randomUUID(),
				teamId,
				userId,
				role,
			})
			.returning();

		return member;
	}

	/**
	 * Removes a member from a team.
	 * @param teamId - The ID of the team.
	 * @param userId - The ID of the user to remove.
	 * @returns True if removed successfully.
	 */
	async removeTeamMember(teamId: string, userId: string) {
		const [member] = await db
			.delete(teamMembers)
			.where(
				and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
			)
			.returning();

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
		const [member] = await db
			.update(teamMembers)
			.set({
				role,
			})
			.where(
				and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
			)
			.returning();

		return member;
	}

	/**
	 * Gets all members of a team.
	 * @param teamId - The ID of the team.
	 * @returns The team members with their user details.
	 */
	async getTeamMembers(teamId: string) {
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
		const team = await db.query.teams.findFirst({
			where: eq(teams.id, teamId),
		});

		if (!team) {
			throw ErrorService.createError("NOT_FOUND", "Team not found");
		}

		if (team.type === "personal") {
			throw ErrorService.createError(
				"FORBIDDEN",
				"Cannot delete personal team",
			);
		}

		const [record] = await db
			.update(teams)
			.set({ deletedAt: new Date() })
			.where(eq(teams.id, teamId))
			.returning();

		return !!record;
	}

	/**
	 * Ensures a user has a personal team, creating one if it doesn't exist.
	 * @param userId - The ID of the user.
	 * @returns The user's personal team.
	 */
	async ensurePersonalTeam(userId: string) {
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
}
// Export a singleton instance
export const teamService = new TeamService();
