"use server";

import { cacheService } from "@/server/services/cache-service";
import { ErrorService } from "@/server/services/error-service";
import {
    rateLimitService,
    rateLimits,
} from "@/server/services/rate-limit-service";
import { rbacService } from "@/server/services/rbac";

/**
 * Gets all roles for a user across all contexts
 */
export async function getUserRoles(userId: string) {
    try {
        // Rate limiting
        await rateLimitService.checkLimit(
            userId,
            "getUserRoles",
            rateLimits.api.default,
        );

        // Try to get from cache first
        return await cacheService.getOrSet(
            `user:${userId}:roles`,
            () => rbacService.getAllUserRoles(userId),
            { ttl: 300 }, // Cache for 5 minutes
        );
    } catch (error) {
        throw ErrorService.handleError(error);
    }
}
