import type { CollectionConfig } from "payload";

export const RBAC: CollectionConfig = {
	slug: "rbac",
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name", "type", "description"],
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
		{
			name: "description",
			type: "textarea",
			required: true,
		},
		{
			name: "type",
			type: "select",
			required: true,
			options: [
				{ label: "Role", value: "role" },
				{ label: "Permission", value: "permission" },
			],
		},
		{
			name: "resource",
			type: "select",
			required: false,
			options: [
				{ label: "Team", value: "team" },
				{ label: "Project", value: "project" },
				{ label: "User", value: "user" },
				{ label: "API Key", value: "api_key" },
				{ label: "Billing", value: "billing" },
				{ label: "Settings", value: "settings" },
			],
			admin: {
				condition: (data) => data.type === "permission",
			},
		},
		{
			name: "action",
			type: "select",
			required: false,
			options: [
				{ label: "Create", value: "create" },
				{ label: "Read", value: "read" },
				{ label: "Update", value: "update" },
				{ label: "Delete", value: "delete" },
				{ label: "Manage", value: "manage" },
			],
			admin: {
				condition: (data) => data.type === "permission",
			},
		},
		{
			name: "permissions",
			type: "relationship",
			relationTo: "rbac",
			hasMany: true,
			filterOptions: {
				type: {
					equals: "permission",
				},
			},
			admin: {
				condition: (data) => data.type === "role",
			},
		},
	],
};
