"use server";

import { projectService } from "@/server/services/project-service";
import { revalidatePath } from "next/cache";

/**
 * Creates a new project and adds the current user as the owner.
 * @returns The created project with its members
 */
export async function createProject(
	name: string,
	teamId: string,
	userId: string,
) {
	const project = await projectService.createProject(teamId, name, userId);
	revalidatePath("/");
	return project;
}

/**
 * Updates a project's information.
 * @returns The updated project with its members
 */
export async function updateProject(projectId: string, name: string) {
	const project = await projectService.updateProject(projectId, name);
	revalidatePath("/");
	return project;
}

/**
 * Deletes a project and all associated data.
 * @returns True if deleted successfully
 */
export async function deleteProject(projectId: string) {
	const success = await projectService.deleteProject(projectId);
	revalidatePath("/");
	return success;
}

/**
 * Gets all projects for a team.
 * @returns The team's projects with their members
 */
export async function getTeamProjects(teamId: string) {
	return projectService.getTeamProjects(teamId);
}

/**
 * Checks if a user has access to a project.
 * @returns True if the user has access
 */
export async function userHasProjectAccess(userId: string, projectId: string) {
	return projectService.userHasAccessToProject(userId, projectId);
}

/**
 * Gets all members of a project.
 * @returns The project members with their user details
 */
export async function getProjectMembers(projectId: string) {
	return projectService.getProjectMembers(projectId);
}

/**
 * Adds a member to a project.
 * @returns The created project member
 */
export async function addProjectMember(
	projectId: string,
	userId: string,
	role: string,
) {
	const member = await projectService.addProjectMember(projectId, userId, role);
	revalidatePath("/");
	return member;
}

/**
 * Removes a member from a project.
 * @returns True if removed successfully
 */
export async function removeProjectMember(projectId: string, userId: string) {
	const success = await projectService.removeProjectMember(projectId, userId);
	revalidatePath("/");
	return success;
}

/**
 * Updates a project member's role.
 * @returns The updated project member
 */
export async function updateProjectMemberRole(
	projectId: string,
	userId: string,
	role: string,
) {
	const member = await projectService.updateProjectMemberRole(
		projectId,
		userId,
		role,
	);
	revalidatePath("/");
	return member;
}
