import { type ActivityLogOptions } from "@/server/constants/activity-log";
import { logActivity } from "@/server/services/activity-logger";
import { type Session } from "next-auth";

/**
 * Server-side utility for activity logging
 *
 * @example
 * ```ts
 * // In a server component or API route
 * const session = await auth();
 * await ActivityLogger.auth.logSignup(session, {
 *   details: "User signed up via email"
 * });
 * ```
 */
export class ActivityLogger {
    static auth = {
        async logSignup(
            session: Session | null,
            options: Omit<ActivityLogOptions, "action" | "category" | "userId">,
        ) {
            return logActivity({
                action: "user.signup",
                category: "auth",
                userId: session?.user?.id,
                ...options,
            });
        },

        async logLogin(
            session: Session | null,
            options: Omit<ActivityLogOptions, "action" | "category" | "userId">,
        ) {
            return logActivity({
                action: "user.login",
                category: "auth",
                userId: session?.user?.id,
                ...options,
            });
        },

        async logLogout(
            session: Session | null,
            options: Omit<ActivityLogOptions, "action" | "category" | "userId">,
        ) {
            return logActivity({
                action: "user.logout",
                category: "auth",
                userId: session?.user?.id,
                ...options,
            });
        },
    };

    static team = {
        async logTeamCreate(
            session: Session | null,
            options: Omit<ActivityLogOptions, "action" | "category" | "userId">,
        ) {
            return logActivity({
                action: "team.create",
                category: "team",
                userId: session?.user?.id,
                ...options,
            });
        },

        async logTeamUpdate(
            session: Session | null,
            options: Omit<ActivityLogOptions, "action" | "category" | "userId">,
        ) {
            return logActivity({
                action: "team.update",
                category: "team",
                userId: session?.user?.id,
                ...options,
            });
        },

        async logTeamDelete(
            session: Session | null,
            options: Omit<ActivityLogOptions, "action" | "category" | "userId">,
        ) {
            return logActivity({
                action: "team.delete",
                category: "team",
                userId: session?.user?.id,
                ...options,
            });
        },
    };

    static resource = {
        async logResourceCreate(
            session: Session | null,
            options: Omit<ActivityLogOptions, "action" | "category" | "userId">,
        ) {
            return logActivity({
                action: "resource.create",
                category: "resource",
                userId: session?.user?.id,
                ...options,
            });
        },

        async logResourceUpdate(
            session: Session | null,
            options: Omit<ActivityLogOptions, "action" | "category" | "userId">,
        ) {
            return logActivity({
                action: "resource.update",
                category: "resource",
                userId: session?.user?.id,
                ...options,
            });
        },

        async logResourceDelete(
            session: Session | null,
            options: Omit<ActivityLogOptions, "action" | "category" | "userId">,
        ) {
            return logActivity({
                action: "resource.delete",
                category: "resource",
                userId: session?.user?.id,
                ...options,
            });
        },
    };

    static system = {
        async logError(options: Omit<ActivityLogOptions, "action" | "category">) {
            return logActivity({
                action: "system.error",
                category: "system",
                severity: "error",
                ...options,
            });
        },

        async logPerformanceAlert(
            options: Omit<ActivityLogOptions, "action" | "category">,
        ) {
            return logActivity({
                action: "system.performance.alert",
                category: "system",
                severity: "warning",
                ...options,
            });
        },

        async logSecurityAlert(
            options: Omit<ActivityLogOptions, "action" | "category">,
        ) {
            return logActivity({
                action: "system.security.alert",
                category: "system",
                severity: "error",
                ...options,
            });
        },
    };
}
