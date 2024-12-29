import { db } from "@/server/db";
import {
    permissions,
    projectMembers,
    rolePermissions,
    roles,
    teamMembers,
} from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { BaseService } from "./base-service";

export interface Permission {
    resource: string;
    action: string;
    attributes?: Record<string, unknown>;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: Permission[];
}

/**
 * Role-Based Access Control (RBAC) Service
 *
 * Handles all role and permission operations including:
 * - Role creation and management
 * - Permission assignment
 * - Access checking
 * - Role inheritance (future)
 */
export class RBACService extends BaseService<typeof roles> {
    constructor() {
        super({
            table: roles,
            idField: "id",
            softDelete: true,
        });
    }

    /**
     * Create a new role with the given permissions
     */
    async createRole(
        name: string,
        description?: string,
        permissionIds: string[] = [],
    ) {
        return await db.transaction(async (tx) => {
            const role = await tx
                .insert(roles)
                .values({
                    id: crypto.randomUUID(),
                    name,
                    description,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning()
                .then((rows) => rows[0]);

            if (!role) {
                throw new Error("Failed to create role");
            }

            if (permissionIds.length > 0) {
                await tx.insert(rolePermissions).values(
                    permissionIds.map((permissionId) => ({
                        id: crypto.randomUUID(),
                        roleId: role.id,
                        permissionId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })),
                );
            }

            return role;
        });
    }

    /**
     * Check if a user has the required permission for a resource
     */
    async hasPermission(
        userId: string,
        resource: string,
        action: string,
        context?: {
            teamId?: string;
            projectId?: string;
        },
    ): Promise<boolean> {
        // Get user's roles based on context
        const userRoles = await this.getUserRoles(userId, context);

        // Get permissions for these roles
        const roleIds = userRoles.map((r) => r.role);

        if (roleIds.length === 0) {
            return false;
        }

        const perms = await db
            .select()
            .from(permissions)
            .innerJoin(
                rolePermissions,
                eq(permissions.id, rolePermissions.permissionId),
            )
            .where(
                and(
                    eq(permissions.resource, resource),
                    eq(permissions.action, action),
                    inArray(rolePermissions.roleId, roleIds),
                ),
            );

        return perms.length > 0;
    }

    /**
     * Get all roles assigned to a user in a specific context
     */
    private async getUserRoles(
        userId: string,
        context?: {
            teamId?: string;
            projectId?: string;
        },
    ) {
        if (context?.teamId) {
            // Get team roles
            return await db.query.teamMembers.findMany({
                where: and(
                    eq(teamMembers.userId, userId),
                    eq(teamMembers.teamId, context.teamId),
                ),
                with: {
                    team: true,
                },
            });
        }

        if (context?.projectId) {
            // Get project roles
            return await db.query.projectMembers.findMany({
                where: and(
                    eq(projectMembers.userId, userId),
                    eq(projectMembers.projectId, context.projectId),
                ),
                with: {
                    project: true,
                },
            });
        }

        // Get global roles (future implementation)
        return [];
    }

    /**
     * Assign permissions to a role
     */
    async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
        return await db.insert(rolePermissions).values(
            permissionIds.map((permissionId) => ({
                id: crypto.randomUUID(),
                roleId,
                permissionId,
                createdAt: new Date(),
                updatedAt: new Date(),
            })),
        );
    }

    /**
     * Remove permissions from a role
     */
    async removePermissionsFromRole(roleId: string, permissionIds: string[]) {
        return await db
            .delete(rolePermissions)
            .where(
                and(
                    eq(rolePermissions.roleId, roleId),
                    inArray(rolePermissions.permissionId, permissionIds),
                ),
            );
    }

    /**
     * Get all permissions for a role
     */
    async getRolePermissions(roleId: string) {
        return await db.query.rolePermissions.findMany({
            where: eq(rolePermissions.roleId, roleId),
            with: {
                permission: true,
            },
        });
    }

    /**
     * Get all roles with their permissions
     */
    async getAllRolesWithPermissions() {
        return await db.query.roles.findMany({
            with: {
                permissions: {
                    with: {
                        permission: true,
                    },
                },
            },
        });
    }

    /**
     * Delete a role and all its permission assignments
     */
    async deleteRole(roleId: string) {
        await db.transaction(async (tx) => {
            // Delete role permissions first
            await tx
                .delete(rolePermissions)
                .where(eq(rolePermissions.roleId, roleId));

            // Delete the role
            await tx.delete(roles).where(eq(roles.id, roleId));
        });
    }

    /**
     * Gets all roles assigned to a user across all contexts (teams and projects)
     */
    async getAllUserRoles(userId: string) {
        // Get team roles
        const teamRoles = await db.query.teamMembers.findMany({
            where: eq(teamMembers.userId, userId),
            columns: {
                role: true,
            },
        });

        // Get project roles
        const projectRoles = await db.query.projectMembers.findMany({
            where: eq(projectMembers.userId, userId),
            columns: {
                role: true,
            },
        });

        // Combine and deduplicate roles
        const allRoles = [...teamRoles, ...projectRoles].map((r) => r.role);
        return [...new Set(allRoles)];
    }
}

// Export a singleton instance
export const rbacService = new RBACService();
