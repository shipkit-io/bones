import { and, eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
	permissions,
	projectMembers,
	rolePermissions,
	roles,
	teamMembers,
} from "@/server/db/schema";
import { BaseService } from "./base-service";

export interface Permission {
	id: string;
	resource: string;
	action: string;
	description?: string;
}

export interface PermissionConfig {
	resource: string;
	action: string;
	context?: {
		teamIdParam?: string; // URL parameter name for team ID
		projectIdParam?: string; // URL parameter name for project ID
	};
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
	async createRole(name: string, description?: string, permissionIds: string[] = []) {
		return await db?.transaction(async (tx) => {
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
					}))
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
		}
	): Promise<boolean> {
		// Get user's roles based on context
		const userRoles = await this.getUserRoles(userId, context);

		// If userRoles is undefined (db error), return false
		if (!userRoles) {
			return false;
		}

		// Get permissions for these roles
		const roleIds = userRoles.map((r) => r.role);

		if (roleIds.length === 0) {
			return false;
		}

		const perms = await db
			?.select()
			.from(permissions)
			.innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
			.where(
				and(
					eq(permissions.resource, resource),
					eq(permissions.action, action),
					inArray(rolePermissions.roleId, roleIds)
				)
			);

		// If perms is undefined or empty, return false
		return !!perms && perms.length > 0;
	}

	/**
	 * Get all roles assigned to a user in a specific context
	 */
	private async getUserRoles(
		userId: string,
		context?: {
			teamId?: string;
			projectId?: string;
		}
	) {
		if (context?.teamId) {
			// Get team roles
			return db?.query.teamMembers.findMany({
				where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, context.teamId)),
				with: {
					team: true,
				},
			});
		}

		if (context?.projectId) {
			// Get project roles
			return db?.query.projectMembers.findMany({
				where: and(
					eq(projectMembers.userId, userId),
					eq(projectMembers.projectId, context.projectId)
				),
				with: {
					project: true,
				},
			});
		}

		// Get global roles (future implementation)
		return []; // Return empty array if no context or db error
	}

	/**
	 * Assign permissions to a role
	 */
	async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
		return await db?.insert(rolePermissions).values(
			permissionIds.map((permissionId) => ({
				id: crypto.randomUUID(),
				roleId,
				permissionId,
				createdAt: new Date(),
				updatedAt: new Date(),
			}))
		);
	}

	/**
	 * Remove permissions from a role
	 */
	async removePermissionsFromRole(roleId: string, permissionIds: string[]) {
		return await db
			?.delete(rolePermissions)
			.where(
				and(
					eq(rolePermissions.roleId, roleId),
					inArray(rolePermissions.permissionId, permissionIds)
				)
			);
	}

	/**
	 * Get all permissions for a role
	 */
	async getRolePermissions(roleId: string) {
		return await db?.query.rolePermissions.findMany({
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
		return await db?.query.roles.findMany({
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
		await db?.transaction(async (tx) => {
			// Delete role permissions first
			await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

			// Delete the role
			await tx.delete(roles).where(eq(roles.id, roleId));
		});
	}

	/**
	 * Gets all roles assigned to a user across all contexts (teams and projects)
	 */
	async getAllUserRoles(userId: string) {
		// Get team roles, default to empty array if db is undefined
		const teamRoles =
			(await db?.query.teamMembers.findMany({
				where: eq(teamMembers.userId, userId),
				columns: {
					role: true,
				},
			})) || [];

		// Get project roles, default to empty array if db is undefined
		const projectRoles =
			(await db?.query.projectMembers.findMany({
				where: eq(projectMembers.userId, userId),
				columns: {
					role: true,
				},
			})) || [];

		// Combine and deduplicate roles
		const allRoles = [...teamRoles, ...projectRoles].map((r) => r.role);
		return [...new Set(allRoles)];
	}

	/**
	 * Check if the current user has the required permission for the request
	 *
	 * Usage:
	 * ```ts
	 * export async function POST(req: NextRequest) {
	 *   const permissionCheck = await RBACService.checkPermission(req, {
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
	static async checkPermission(req: NextRequest, config: PermissionConfig) {
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
			const projectId = req.nextUrl.searchParams.get(config.context.projectIdParam);
			if (projectId) {
				context.projectId = projectId;
			}
		}

		const rbacService = new RBACService();
		const hasPermission = await rbacService.hasPermission(
			session.user.id,
			config.resource,
			config.action,
			context
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
}

// Export a singleton instance
export const rbacService = new RBACService();
