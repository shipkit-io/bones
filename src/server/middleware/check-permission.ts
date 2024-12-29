import { auth } from "@/server/auth";
import { RBACService } from "@/server/services/rbac";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export interface PermissionConfig {
    resource: string;
    action: string;
    context?: {
        teamIdParam?: string; // URL parameter name for team ID
        projectIdParam?: string; // URL parameter name for project ID
    };
}

/**
 * Middleware to check if the current user has the required permission
 *
 * Usage:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const permissionCheck = await checkPermission(req, {
 *     resource: "team",
 *     action: "create",
 *   });
 *
 *   if (!permissionCheck.success) {
 *     return permissionCheck.response;
 *   }
 *
 *   // Continue with the request handling
 * }
 * ```
 */
export async function checkPermission(
    req: NextRequest,
    config: PermissionConfig,
) {
    const session = await auth();

    if (!session?.user?.id) {
        return {
            success: false,
            response: new NextResponse(null, {
                status: 401,
                statusText: "Unauthorized",
            }),
        };
    }

    // Extract context IDs from URL if specified
    const context: { teamId?: string; projectId?: string } = {};

    if (config.context?.teamIdParam) {
        const teamId = req.nextUrl.searchParams.get(config.context.teamIdParam);
        if (teamId) {
            context.teamId = teamId;
        }
    }

    if (config.context?.projectIdParam) {
        const projectId = req.nextUrl.searchParams.get(
            config.context.projectIdParam,
        );
        if (projectId) {
            context.projectId = projectId;
        }
    }

    const hasPermission = await RBACService.hasPermission(
        session.user.id,
        config.resource,
        config.action,
        context,
    );

    if (!hasPermission) {
        return {
            success: false,
            response: new NextResponse(null, {
                status: 403,
                statusText: "Forbidden",
            }),
        };
    }

    return {
        success: true,
        userId: session.user.id,
        context,
    };
}
