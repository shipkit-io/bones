import type { CollectionConfig } from "payload";

export const Features: CollectionConfig = {
	slug: "features",
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name", "category", "plans"],
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
			name: "category",
			type: "select",
			required: true,
			options: [
				{ label: "Core Features", value: "core" },
				{ label: "Developer Experience", value: "dx" },
				{ label: "Database & Backend", value: "backend" },
				{ label: "Advanced Features", value: "advanced" },
				{ label: "Security & Performance", value: "security" },
				{ label: "Deployment & DevOps", value: "devops" },
				{ label: "Support", value: "support" },
			],
		},
		{
			name: "plans",
			type: "select",
			required: true,
			hasMany: true,
			options: [
				{ label: "Bones", value: "bones" },
				{ label: "Brains", value: "brains" },
			],
		},
		{
			name: "badge",
			type: "select",
			options: [
				{ label: "New", value: "new" },
				{ label: "Popular", value: "popular" },
				{ label: "Pro", value: "pro" },
			],
		},
		{
			name: "icon",
			type: "text",
			admin: {
				description: "Lucide icon name",
			},
		},
		{
			name: "order",
			type: "number",
			admin: {
				description: "Order within category",
			},
		},
	],
};
