"use server";

import { cacheConfigs, cacheService } from "@/server/services/cache-service";
import { ErrorService } from "@/server/services/error-service";
import { metrics, metricsService } from "@/server/services/metrics-service";
import {
    rateLimitService,
    rateLimits,
} from "@/server/services/rate-limit-service";
import { userService } from "@/server/services/user-service";
import { ValidationService } from "@/server/services/validation-service";
import { revalidatePath } from "next/cache";
import { updateProfileSchema, userSchema } from "./schemas";

/**
 * Ensures a user exists in the database.
 * @returns The user with their details
 */
export async function ensureUserExists(authUser: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
}) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(
            authUser.id,
            "ensureUserExists",
            rateLimits.auth,
        );

        // Validation
        await ValidationService.validateOrThrow(userSchema, authUser);

        // Metrics start
        const startTime = Date.now();

        // Create or update user
        const user = await userService.ensureUserExists(authUser);

        // Metrics end
        await metricsService.recordTiming(metrics.api.latency, startTime);
        await metricsService.incrementCounter(metrics.api.requests);
        await metricsService.incrementCounter(metrics.auth.registrations);

        // Invalidate cache
        await cacheService.delete(`user:${user.id}`);
        await cacheService.delete(`user:${user.email}`);

        revalidatePath("/");
        return user;
    } catch (error) {
        await metricsService.incrementCounter(metrics.api.errors);
        throw ErrorService.handleError(error);
    }
}

/**
 * Gets a user by their email address.
 * @returns The user if found
 */
export async function getUserByEmail(email: string) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(
            email,
            "getUserByEmail",
            rateLimits.api.default,
        );

        // Validation
        await ValidationService.validateOrThrow(userSchema, { email });

        // Try to get from cache first
        return await cacheService.getOrSet(
            `user:${email}`,
            async () => {
                const startTime = Date.now();
                const user = await userService.getUserByEmail(email);
                await metricsService.recordTiming(metrics.api.latency, startTime);
                await metricsService.incrementCounter(metrics.api.requests);
                return user;
            },
            cacheConfigs.medium,
        );
    } catch (error) {
        await metricsService.incrementCounter(metrics.api.errors);
        throw ErrorService.handleError(error);
    }
}

/**
 * Gets a user with all their associations.
 * @returns The user with their teams and projects
 */
export async function getUserWithAssociations(userId: string) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(
            userId,
            "getUserWithAssociations",
            rateLimits.api.default,
        );

        // Validation
        await ValidationService.validateOrThrow(userSchema, { id: userId });

        // Try to get from cache first
        return await cacheService.getOrSet(
            `user:${userId}:associations`,
            async () => {
                const startTime = Date.now();
                const user = await userService.getUserWithAssociations(userId);
                await metricsService.recordTiming(metrics.api.latency, startTime);
                await metricsService.incrementCounter(metrics.api.requests);
                return user;
            },
            cacheConfigs.short,
        );
    } catch (error) {
        await metricsService.incrementCounter(metrics.api.errors);
        throw ErrorService.handleError(error);
    }
}

/**
 * Updates a user's profile information.
 * @returns The updated user
 */
export async function updateProfile(
    userId: string,
    data: {
        name?: string | null;
        image?: string | null;
    },
) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(
            userId,
            "updateProfile",
            rateLimits.web.forms,
        );

        // Validation
        await ValidationService.validateOrThrow(updateProfileSchema, {
            userId,
            data,
        });

        // Metrics start
        const startTime = Date.now();

        // Update profile
        const user = await userService.updateProfile(userId, data);

        // Metrics end
        await metricsService.recordTiming(metrics.api.latency, startTime);
        await metricsService.incrementCounter(metrics.api.requests);

        // Invalidate cache
        await cacheService.delete(`user:${user.id}`);
        await cacheService.delete(`user:${user.email}`);
        await cacheService.delete(`user:${user.id}:associations`);

        revalidatePath("/");
        return user;
    } catch (error) {
        await metricsService.incrementCounter(metrics.api.errors);
        throw ErrorService.handleError(error);
    }
}

/**
 * Verifies a user's email address.
 * @returns The updated user
 */
export async function verifyEmail(userId: string) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(userId, "verifyEmail", rateLimits.auth);

        // Validation
        await ValidationService.validateOrThrow(userSchema, { id: userId });

        // Metrics start
        const startTime = Date.now();

        // Verify email
        const user = await userService.verifyEmail(userId);

        // Metrics end
        await metricsService.recordTiming(metrics.api.latency, startTime);
        await metricsService.incrementCounter(metrics.api.requests);

        // Invalidate cache
        await cacheService.delete(`user:${user.id}`);
        await cacheService.delete(`user:${user.email}`);

        revalidatePath("/");
        return user;
    } catch (error) {
        await metricsService.incrementCounter(metrics.api.errors);
        throw ErrorService.handleError(error);
    }
}

/**
 * Gets all users in a team.
 * @returns The team's users with their roles
 */
export async function getTeamUsers(teamId: string) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(
            teamId,
            "getTeamUsers",
            rateLimits.api.default,
        );

        // Validation
        await ValidationService.validateOrThrow(userSchema, { id: teamId });

        // Try to get from cache first
        return await cacheService.getOrSet(
            `team:${teamId}:users`,
            async () => {
                const startTime = Date.now();
                const users = await userService.getTeamUsers(teamId);
                await metricsService.recordTiming(metrics.api.latency, startTime);
                await metricsService.incrementCounter(metrics.api.requests);
                return users;
            },
            cacheConfigs.short,
        );
    } catch (error) {
        await metricsService.incrementCounter(metrics.api.errors);
        throw ErrorService.handleError(error);
    }
}

/**
 * Gets all users in a project.
 * @returns The project's users with their roles
 */
export async function getProjectUsers(projectId: string) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(
            projectId,
            "getProjectUsers",
            rateLimits.api.default,
        );

        // Validation
        await ValidationService.validateOrThrow(userSchema, { id: projectId });

        // Try to get from cache first
        return await cacheService.getOrSet(
            `project:${projectId}:users`,
            async () => {
                const startTime = Date.now();
                const users = await userService.getProjectUsers(projectId);
                await metricsService.recordTiming(metrics.api.latency, startTime);
                await metricsService.incrementCounter(metrics.api.requests);
                return users;
            },
            cacheConfigs.short,
        );
    } catch (error) {
        await metricsService.incrementCounter(metrics.api.errors);
        throw ErrorService.handleError(error);
    }
}

/**
 * Checks if a user has access to a team.
 * @returns True if the user has access
 */
export async function hasTeamAccess(userId: string, teamId: string) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(
            `${userId}:${teamId}`,
            "hasTeamAccess",
            rateLimits.api.default,
        );

        // Validation
        await ValidationService.validateOrThrow(userSchema, { id: userId });

        // Try to get from cache first
        return await cacheService.getOrSet(
            `user:${userId}:team:${teamId}:access`,
            async () => {
                const startTime = Date.now();
                const hasAccess = await userService.hasTeamAccess(userId, teamId);
                await metricsService.recordTiming(metrics.api.latency, startTime);
                await metricsService.incrementCounter(metrics.api.requests);
                return hasAccess;
            },
            cacheConfigs.medium,
        );
    } catch (error) {
        await metricsService.incrementCounter(metrics.api.errors);
        throw ErrorService.handleError(error);
    }
}

/**
 * Checks if a user has access to a project.
 * @returns True if the user has access
 */
export async function hasProjectAccess(userId: string, projectId: string) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(
            `${userId}:${projectId}`,
            "hasProjectAccess",
            rateLimits.api.default,
        );

        // Validation
        await ValidationService.validateOrThrow(userSchema, { id: userId });

        // Try to get from cache first
        return await cacheService.getOrSet(
            `user:${userId}:project:${projectId}:access`,
            async () => {
                const startTime = Date.now();
                const hasAccess = await userService.hasProjectAccess(userId, projectId);
                await metricsService.recordTiming(metrics.api.latency, startTime);
                await metricsService.incrementCounter(metrics.api.requests);
                return hasAccess;
            },
            cacheConfigs.medium,
        );
    } catch (error) {
        await metricsService.incrementCounter(metrics.api.errors);
        throw ErrorService.handleError(error);
    }
}
