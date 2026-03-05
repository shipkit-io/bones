import { and, eq } from "drizzle-orm";
import { LocalProjectStorage } from "@/lib/local-storage/project-storage";
import { db } from "@/server/db";
import { projectMembers, projects, teams } from "@/server/db/schema";
import { BaseService } from "./base-service";
import { teamService } from "./team-service";

export class ProjectService extends BaseService<typeof projects> {
	constructor() {
		super({
			table: projects,
			idField: "id",
			softDelete: true,
		});
	}

	/**
	 * Creates a new project under a team and assigns the creator as the owner.
	 * @param teamId - The ID of the team.
	 * @param projectName - The name of the project.
	 * @param creatorUserId - The ID of the user creating the project.
	 * @returns The created project with its members, or undefined if db is not available.
	 */
	async createProject(teamId: string, projectName: string, creatorUserId: string) {
		if (!db) {
			return LocalProjectStorage.createProject(teamId, projectName, creatorUserId);
		}
		const projectId = crypto.randomUUID();

		// Resolve placeholder or invalid team identifiers to a real team id
		let effectiveTeamId = teamId;
		try {
			// If the incoming teamId is a placeholder (e.g., "personal") or empty, map to user's personal team
			if (!effectiveTeamId || effectiveTeamId === "personal") {
				const personalTeam = await teamService.getPersonalTeam(creatorUserId);
				effectiveTeamId = personalTeam?.id ?? effectiveTeamId;
			}

			// If still not resolvable, or the team does not exist, attempt to ensure a personal team
			if (effectiveTeamId) {
				const existingTeam = await db.query.teams.findFirst({
					where: eq(teams.id, effectiveTeamId),
				});
				if (!existingTeam) {
					const ensuredPersonalTeam = await teamService.ensureOnePersonalTeam(creatorUserId);
					effectiveTeamId = (ensuredPersonalTeam as any)?.id ?? effectiveTeamId;
				}
			} else {
				const ensuredPersonalTeam = await teamService.ensureOnePersonalTeam(creatorUserId);
				effectiveTeamId = (ensuredPersonalTeam as any)?.id ?? effectiveTeamId;
			}
		} catch {
			// Best-effort mapping; fall through with original value if anything fails
		}

		// Use optional chaining for the transaction
		const transactionResult = await db?.transaction(async (tx) => {
			await tx.insert(projects).values({
				id: projectId,
				name: projectName,
				teamId: effectiveTeamId,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await tx.insert(projectMembers).values({
				id: crypto.randomUUID(),
				projectId: projectId,
				userId: creatorUserId,
				role: "owner",
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			// Indicate success within the transaction callback
			return true;
		});

		// If transaction didn't run or failed (db undefined), return undefined
		if (!transactionResult) {
			return undefined;
		}

		// Use optional chaining for the subsequent query
		const project = await db?.query.projects.findFirst({
			where: eq(projects.id, projectId),
			with: {
				members: {
					with: {
						user: true,
					},
				},
				team: true,
			},
		});

		// If project is not found (or db was undefined), throw error as before
		// (or return undefined if that's preferred behaviour when creation seemingly succeeded but fetch failed)
		if (!project) {
			throw new Error("Failed to retrieve project after creation");
		}

		return project;
	}

	/**
	 * Retrieves all projects associated with a team.
	 * @param teamId - The ID of the team.
	 * @returns A list of projects with their details, or undefined if db is not available.
	 */
	async getTeamProjects(teamId: string) {
		if (!db) {
			return LocalProjectStorage.getTeamProjects(teamId);
		}
		// Use optional chaining and default to empty array if db is undefined
		return db?.query.projects.findMany({
			where: eq(projects.teamId, teamId),
			with: {
				members: {
					with: {
						user: true,
					},
				},
				team: true,
			},
		});
	}

	/**
	 * Checks if a user has access to a specific project.
	 * @param userId - The ID of the user.
	 * @param projectId - The ID of the project.
	 * @returns True if the user has access, otherwise false.
	 */
	async userHasAccessToProject(userId: string, projectId: string): Promise<boolean> {
		if (!db) {
			return LocalProjectStorage.userHasAccessToProject(userId, projectId);
		}
		const projectMember = await db?.query.projectMembers.findFirst({
			where: and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)),
		});

		// Double negation handles undefined safely (!!undefined === false)
		return !!projectMember;
	}

	/**
	 * Updates a project's information.
	 * @param projectId - The ID of the project to update.
	 * @param projectName - The new name for the project.
	 * @returns The updated project with its details, or null/undefined.
	 */
	async updateProject(projectId: string, projectName: string) {
		if (!db) {
			return LocalProjectStorage.updateProject(projectId, projectName);
		}
		// Assuming `this.update` handles potential db issues internally or uses BaseService logic
		const updatedBase = await this.update(projectId, { name: projectName });

		// If the base update failed (e.g., db unavailable in BaseService), return null
		if (!updatedBase) {
			return null;
		}

		// Fetch the updated project with relations
		return db?.query.projects.findFirst({
			where: eq(projects.id, projectId),
			with: {
				members: {
					with: {
						user: true,
					},
				},
				team: true,
			},
		});
	}

	/**
	 * Deletes a project and all associated data.
	 * @param projectId - The ID of the project to delete.
	 * @returns True if the transaction was attempted, false if db was undefined.
	 */
	async deleteProject(projectId: string): Promise<boolean> {
		if (!db) {
			return LocalProjectStorage.deleteProject(projectId);
		}
		const transactionResult = await db?.transaction(async (tx) => {
			// Delete project members first due to foreign key constraint
			await tx.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
			// Delete the project
			await tx.delete(projects).where(eq(projects.id, projectId));
			return true; // Indicate success
		});

		// Return true if the transaction ran (even if it failed inside), false if db was undefined
		return !!transactionResult;
	}

	/**
	 * Adds a member to a project.
	 * @param projectId - The ID of the project.
	 * @param userId - The ID of the user to add.
	 * @param role - The role to assign to the user.
	 * @returns The created project member, or undefined if db is not available.
	 */
	async addProjectMember(projectId: string, userId: string, role: string) {
		if (!db) {
			return LocalProjectStorage.addProjectMember(projectId, userId, role);
		}
		// Use optional chaining and default to empty array for destructuring
		const [member] =
			(await db
				?.insert(projectMembers)
				.values({
					id: crypto.randomUUID(),
					projectId,
					userId,
					role,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning()) || []; // Fallback to empty array

		return member; // Returns the member or undefined
	}

	/**
	 * Removes a member from a project.
	 * @param projectId - The ID of the project.
	 * @param userId - The ID of the user to remove.
	 * @returns True if removed successfully, false otherwise (or if db unavailable).
	 */
	async removeProjectMember(projectId: string, userId: string) {
		if (!db) {
			return LocalProjectStorage.removeProjectMember(projectId, userId);
		}
		// Use optional chaining and default to empty array for destructuring
		const [member] =
			(await db
				?.delete(projectMembers)
				.where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
				.returning()) || []; // Fallback to empty array

		return !!member; // Returns true if member was returned, false otherwise
	}

	/**
	 * Updates a project member's role.
	 * @param projectId - The ID of the project.
	 * @param userId - The ID of the user.
	 * @param role - The new role to assign.
	 * @returns The updated project member, or undefined if db unavailable or member not found.
	 */
	async updateProjectMemberRole(projectId: string, userId: string, role: string) {
		if (!db) {
			return LocalProjectStorage.updateProjectMemberRole(projectId, userId, role);
		}
		// Use optional chaining and default to empty array for destructuring
		const [member] =
			(await db
				?.update(projectMembers)
				.set({
					role,
					updatedAt: new Date(),
				})
				.where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
				.returning()) || []; // Fallback to empty array

		return member; // Returns the member or undefined
	}

	/**
	 * Gets all members of a project.
	 * @param projectId - The ID of the project.
	 * @returns The project members with their user details, or undefined if db is not available.
	 */
	async getProjectMembers(projectId: string) {
		if (!db) {
			return LocalProjectStorage.getProjectMembers(projectId);
		}
		// Use optional chaining
		return db?.query.projectMembers.findMany({
			where: eq(projectMembers.projectId, projectId),
			with: {
				user: true,
			},
		});
	}
}

// Export a singleton instance
export const projectService = new ProjectService();
