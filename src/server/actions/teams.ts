"use server";

/**
 * @fileoverview Server actions for team operations (mutations only)
 * NOTE: For read operations, use teamService directly:
 * import { teamService } from "@/server/services/team-service"
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { cacheService } from "@/server/services/cache-service";
import { ErrorService } from "@/server/services/error-service";
import { metrics, metricsService } from "@/server/services/metrics-service";
import { rateLimitService, rateLimits } from "@/server/services/rate-limit-service";
import { teamService } from "@/server/services/team-service";
import { ValidationService } from "@/server/services/validation-service";
import {
	createTeamSchema,
	teamIdSchema,
	teamMemberSchema,
	updateTeamSchema,
} from "./schemas";

/**
 * Creates a new team and assigns the user as the owner.
 * @returns The created team with its members
 */
export async function createTeam(userId: string, name: string) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(userId, "createTeam", rateLimits.web.forms);

		// Validation
		await ValidationService.validateOrThrow(createTeamSchema, { userId, name });

		// Metrics start
		const startTime = Date.now();

		// Create team
		const team = await teamService.createTeam(userId, name);
		if (!team) {
			throw new Error("Failed to create team");
		}

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`team:${team.id}`);
		await cacheService.delete(`user:${userId}:teams`);

		// Revalidate Next.js cache using tags
		revalidateTag(`user-teams-${userId}`, "max");
		revalidateTag("teams", "max");
		revalidatePath("/");

		return team;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Updates a team's information.
 * @returns The updated team with its details
 */
export async function updateTeam(teamId: string, data: { name?: string }) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(teamId, "updateTeam", rateLimits.web.forms);

		// Validation
		await ValidationService.validateOrThrow(updateTeamSchema, { teamId, ...data });

		// Metrics start
		const startTime = Date.now();

		// Update team
		const team = await teamService.updateTeam(teamId, data);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`team:${teamId}`);

		// Revalidate Next.js cache using tags
		revalidateTag("teams", "max");
		// Revalidate for all users who are members of this team
		const teamMembers = await teamService.getTeamMembers(teamId);
		for (const member of teamMembers || []) {
			revalidateTag(`user-teams-${member.userId}`, "max");
		}
		revalidatePath("/");

		return team;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Deletes a team and all associated data.
 * @returns True if deleted successfully
 */
export async function deleteTeam(teamId: string) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(teamId, "deleteTeam", rateLimits.web.forms);

		// Validation
		await ValidationService.validateOrThrow(teamIdSchema, { teamId });

		// Get team members before deletion for cache invalidation
		const teamMembers = await teamService.getTeamMembers(teamId);

		// Metrics start
		const startTime = Date.now();

		// Delete team
		const success = await teamService.deleteTeam(teamId);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`team:${teamId}`);

		// Revalidate Next.js cache using tags
		revalidateTag("teams", "max");
		// Revalidate for all users who were members of this team
		for (const member of teamMembers || []) {
			revalidateTag(`user-teams-${member.userId}`, "max");
		}
		revalidatePath("/");

		return success;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Adds a member to a team.
 * @returns The created team member
 */
export async function addTeamMember(teamId: string, userId: string, role: string) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(teamId, "addTeamMember", rateLimits.web.forms);

		// Validation
		await ValidationService.validateOrThrow(teamMemberSchema, {
			teamId,
			userId,
			role,
		});

		// Metrics start
		const startTime = Date.now();

		// Add member
		const member = await teamService.addTeamMember(teamId, userId, role);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`team:${teamId}:members`);
		await cacheService.delete(`user:${userId}:teams`);

		revalidatePath("/");
		return member;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Removes a member from a team.
 * @returns True if removed successfully
 */
export async function removeTeamMember(teamId: string, userId: string) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(teamId, "removeTeamMember", rateLimits.web.forms);

		// Validation
		await ValidationService.validateOrThrow(teamMemberSchema, {
			teamId,
			userId,
			role: "member", // Role is required by schema but not needed for removal
		});

		// Metrics start
		const startTime = Date.now();

		// Remove member
		const success = await teamService.removeTeamMember(teamId, userId);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`team:${teamId}:members`);
		await cacheService.delete(`user:${userId}:teams`);

		// Revalidate Next.js cache using tags
		revalidateTag(`user-teams-${userId}`, "max");
		revalidateTag("teams", "max");
		revalidatePath("/");

		return success;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Updates a team member's role.
 * @returns The updated team member
 */
export async function updateTeamMemberRole(teamId: string, userId: string, role: string) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(teamId, "updateTeamMemberRole", rateLimits.web.forms);

		// Validation
		await ValidationService.validateOrThrow(teamMemberSchema, {
			teamId,
			userId,
			role,
		});

		// Metrics start
		const startTime = Date.now();

		// Update member role
		const member = await teamService.updateTeamMemberRole(teamId, userId, role);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`team:${teamId}:members`);

		revalidatePath("/");
		return member;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}
