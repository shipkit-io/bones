import { db } from "@/server/db";
import { projectMembers, projects } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { BaseService } from "./base-service";

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
	 * @returns The created project with its members.
	 */
	async createProject(
		teamId: string,
		projectName: string,
		creatorUserId: string,
	) {
		const projectId = crypto.randomUUID();

		await db.transaction(async (tx) => {
			await tx.insert(projects).values({
				id: projectId,
				name: projectName,
				teamId: teamId,
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
		});

		const project = await db.query.projects.findFirst({
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

		if (!project) {
			throw new Error("Failed to create project");
		}

		return project;
	}

	/**
	 * Retrieves all projects associated with a team.
	 * @param teamId - The ID of the team.
	 * @returns A list of projects with their details.
	 */
	async getTeamProjects(teamId: string) {
		return db.query.projects.findMany({
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
	async userHasAccessToProject(
		userId: string,
		projectId: string,
	): Promise<boolean> {
		const projectMember = await db.query.projectMembers.findFirst({
			where: and(
				eq(projectMembers.userId, userId),
				eq(projectMembers.projectId, projectId),
			),
		});

		return !!projectMember;
	}

	/**
	 * Updates a project's information.
	 * @param projectId - The ID of the project to update.
	 * @param projectName - The new name for the project.
	 * @returns The updated project with its details.
	 */
	async updateProject(projectId: string, projectName: string) {
		const project = await this.update(projectId, { name: projectName });

		if (!project) {
			return null;
		}

		return db.query.projects.findFirst({
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
	 * @returns True if deleted successfully.
	 */
	async deleteProject(projectId: string): Promise<boolean> {
		await db.transaction(async (tx) => {
			// Delete project members first due to foreign key constraint
			await tx
				.delete(projectMembers)
				.where(eq(projectMembers.projectId, projectId));
			// Delete the project
			await tx.delete(projects).where(eq(projects.id, projectId));
		});

		return true;
	}

	/**
	 * Adds a member to a project.
	 * @param projectId - The ID of the project.
	 * @param userId - The ID of the user to add.
	 * @param role - The role to assign to the user.
	 * @returns The created project member.
	 */
	async addProjectMember(projectId: string, userId: string, role: string) {
		const [member] = await db
			.insert(projectMembers)
			.values({
				id: crypto.randomUUID(),
				projectId,
				userId,
				role,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		return member;
	}

	/**
	 * Removes a member from a project.
	 * @param projectId - The ID of the project.
	 * @param userId - The ID of the user to remove.
	 * @returns True if removed successfully.
	 */
	async removeProjectMember(projectId: string, userId: string) {
		const [member] = await db
			.delete(projectMembers)
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userId),
				),
			)
			.returning();

		return !!member;
	}

	/**
	 * Updates a project member's role.
	 * @param projectId - The ID of the project.
	 * @param userId - The ID of the user.
	 * @param role - The new role to assign.
	 * @returns The updated project member.
	 */
	async updateProjectMemberRole(
		projectId: string,
		userId: string,
		role: string,
	) {
		const [member] = await db
			.update(projectMembers)
			.set({
				role,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userId),
				),
			)
			.returning();

		return member;
	}

	/**
	 * Gets all members of a project.
	 * @param projectId - The ID of the project.
	 * @returns The project members with their user details.
	 */
	async getProjectMembers(projectId: string) {
		return db.query.projectMembers.findMany({
			where: eq(projectMembers.projectId, projectId),
			with: {
				user: true,
			},
		});
	}
}

// Export a singleton instance
export const projectService = new ProjectService();
