import { getPayloadClient } from "@/lib/payload/payload";

// Do not import "server-only" here; this module must be runnable in Node scripts (db:sync)

// Define common resources and actions
const resources = ["team", "project", "user", "api_key", "billing", "settings"] as const;

const actions = ["create", "read", "update", "delete", "manage"] as const;

type Resource = (typeof resources)[number];
type Action = (typeof actions)[number];

// Define default roles with their permissions
const defaultRoles = [
	{
		name: "Owner",
		description: "Full access to all resources",
		permissions: resources.map((resource) => ({
			resource,
			actions: ["manage"] as Action[],
		})),
	},
	{
		name: "Admin",
		description: "Administrative access with some restrictions",
		permissions: resources.map((resource) => ({
			resource,
			actions: ["create", "read", "update", "delete"] as Action[],
		})),
	},
	{
		name: "Member",
		description: "Standard team member access",
		permissions: [
			{
				resource: "team" as Resource,
				actions: ["read"] as Action[],
			},
			{
				resource: "project" as Resource,
				actions: ["read", "update"] as Action[],
			},
			{
				resource: "user" as Resource,
				actions: ["read"] as Action[],
			},
			{
				resource: "api_key" as Resource,
				actions: ["read", "create"] as Action[],
			},
			{
				resource: "settings" as Resource,
				actions: ["read"] as Action[],
			},
		],
	},
	{
		name: "Viewer",
		description: "Read-only access",
		permissions: resources.map((resource) => ({
			resource,
			actions: ["read"] as Action[],
		})),
	},
] as const;

export async function seedRbac() {
	const payload = await getPayloadClient();

	if (!payload) {
		console.warn("Payload not available for RBAC seeding");
		return;
	}

	try {
		// Clear existing RBAC data
		await payload.delete({
			collection: "rbac",
			where: {
				id: {
					exists: true,
				},
			},
		});

		// Create all possible permissions first
		const createdPermissions = await Promise.all(
			resources.flatMap((resource) =>
				actions.map(async (action) => {
					const permission = await payload.create({
						collection: "rbac",
						data: {
							name: `${action}_${resource}`,
							description: `Can ${action} ${resource.replace("_", " ")}`,
							type: "permission",
							resource,
							action,
						},
					});
					return permission;
				})
			)
		);

		console.info(`✅ Created ${createdPermissions.length} permissions`);

		// Create default roles with their permissions
		const createdRoles = await Promise.all(
			defaultRoles.map(async (roleData) => {
				// Find relevant permissions for this role
				const rolePermissions = createdPermissions.filter((permission) => {
					const rolePerms = roleData.permissions.find((p) => p.resource === permission?.resource);
					return (
						rolePerms &&
						(rolePerms.actions.includes(permission?.action!) ||
							(rolePerms.actions.includes("manage" as Action) && permission?.action === "manage"))
					);
				});

				// Create the role with its permissions
				const role = await payload.create({
					collection: "rbac",
					data: {
						name: roleData.name,
						description: roleData.description,
						type: "role",
						permissions: rolePermissions.map((p) => p?.id ?? 0), // Ensure id is always a number
					},
				});

				return role;
			})
		);

		console.info(`✅ Created ${createdRoles.length} roles`);
		return { permissions: createdPermissions, roles: createdRoles };
	} catch (error) {
		console.error("Error seeding RBAC:", error);
		throw error;
	}
}
