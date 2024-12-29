"use server";

import { cacheConfigs, cacheService } from "@/server/services/cache-service";
import { ErrorService } from "@/server/services/error-service";
import { metrics, metricsService } from "@/server/services/metrics-service";
import {
	rateLimitService,
	rateLimits,
} from "@/server/services/rate-limit-service";
import { teamService } from "@/server/services/team-service";
import { ValidationService } from "@/server/services/validation-service";
import { revalidatePath } from "next/cache";
import {
	createTeamSchema,
	teamIdSchema,
	teamMemberSchema,
	updateTeamSchema,
	userIdSchema,
} from "./schemas";

/**
 * Creates a new team and assigns the user as the owner.
 * @returns The created team with its members
 */
export async function createTeam(userId: string, name: string) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(
			userId,
			"createTeam",
			rateLimits.web.forms,
		);

		// Validation
		await ValidationService.validateOrThrow(createTeamSchema, { userId, name });

		// Metrics start
		const startTime = Date.now();

		// Create team
		const team = await teamService.createTeam(userId, name);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`team:${team.id}`);
		await cacheService.delete(`user:${userId}:teams`);

		revalidatePath("/");
		return team;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Gets all teams for a user.
 * @returns The user's teams with their members
 */
export async function getUserTeams(userId: string) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(
			userId,
			"getUserTeams",
			rateLimits.api.default,
		);

		// Validation
		await ValidationService.validateOrThrow(userIdSchema, { userId });

		// Try to get from cache first
		return await cacheService.getOrSet(
			`user:${userId}:teams`,
			async () => {
				const startTime = Date.now();
				const teams = await teamService.getUserTeams(userId);
				await metricsService.recordTiming(metrics.api.latency, startTime);
				await metricsService.incrementCounter(metrics.api.requests);
				return teams;
			},
			cacheConfigs.short,
		);
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Gets all members of a team.
 * @returns The team members with their user details
 */
export async function getTeamMembers(teamId: string) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(
			teamId,
			"getTeamMembers",
			rateLimits.api.default,
		);

		// Validation
		await ValidationService.validateOrThrow(teamIdSchema, { teamId });

		// Try to get from cache first
		return await cacheService.getOrSet(
			`team:${teamId}:members`,
			async () => {
				const startTime = Date.now();
				const members = await teamService.getTeamMembers(teamId);
				await metricsService.recordTiming(metrics.api.latency, startTime);
				await metricsService.incrementCounter(metrics.api.requests);
				return members;
			},
			cacheConfigs.short,
		);
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Updates a team's information.
 * @returns The updated team with its members
 */
export async function updateTeam(teamId: string, data: { name?: string }) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(
			teamId,
			"updateTeam",
			rateLimits.web.forms,
		);

		// Validation
		await ValidationService.validateOrThrow(updateTeamSchema, {
			teamId,
			...data,
		});

		// Metrics start
		const startTime = Date.now();

		// Update team
		const team = await teamService.updateTeam(teamId, data);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`team:${teamId}`);
		await cacheService.delete(`team:${teamId}:members`);

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
		await rateLimitService.checkLimit(
			teamId,
			"deleteTeam",
			rateLimits.web.forms,
		);

		// Validation
		await ValidationService.validateOrThrow(teamIdSchema, { teamId });

		// Get team to check if it's personal
		const success = await teamService.deleteTeam(teamId);

		// Metrics start
		const startTime = Date.now();

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`team:${teamId}`);
		await cacheService.delete(`team:${teamId}:members`);

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
export async function addTeamMember(
	teamId: string,
	userId: string,
	role: string,
) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(
			teamId,
			"addTeamMember",
			rateLimits.web.forms,
		);

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
		await rateLimitService.checkLimit(
			teamId,
			"removeTeamMember",
			rateLimits.web.forms,
		);

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
export async function updateTeamMemberRole(
	teamId: string,
	userId: string,
	role: string,
) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(
			teamId,
			"updateTeamMemberRole",
			rateLimits.web.forms,
		);

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
