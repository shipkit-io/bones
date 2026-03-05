import type { CollectionConfig } from "payload";

/**
 * Collection to store Vercel deployment details captured after
 * a user deploys a starter kit (e.g., Bones) via the Vercel integration.
 *
 * This helps track deployments initiated through our platform.
 */
export const VercelDeployments: CollectionConfig = {
	slug: "vercel-deployments",
	admin: {
		useAsTitle: "projectName",
		description: "Stores details of Vercel deployments initiated via Shipkit.",
		defaultColumns: ["projectName", "deploymentUrl", "repositoryUrl", "createdAt"],
		group: "Integrations", // Group under an 'Integrations' section in Payload admin UI
	},
	access: {
		// Define access controls - potentially restrict read/create to admins or specific roles
		read: () => true, // Example: Allow anyone to read (adjust as needed)
		create: () => true, // Example: Allow anyone to create (adjust as needed)
		update: () => false, // Typically, these records shouldn't be updated
		delete: () => false, // Or deleted
	},
	fields: [
		{
			name: "teamId",
			type: "text",
			label: "Vercel Team ID",
			admin: {
				readOnly: true,
			},
		},
		{
			name: "projectId",
			type: "text",
			label: "Vercel Project ID",
			required: true,
			index: true, // Index for faster lookups if needed
			admin: {
				readOnly: true,
			},
		},
		{
			name: "deploymentId",
			type: "text",
			label: "Vercel Deployment ID",
			required: true,
			index: true, // Index for faster lookups
			admin: {
				readOnly: true,
			},
		},
		{
			name: "deploymentDashboardUrl",
			type: "text",
			label: "Deployment Dashboard URL",
			admin: {
				readOnly: true,
			},
		},
		{
			name: "deploymentUrl",
			type: "text",
			label: "Deployment URL",
			admin: {
				readOnly: true,
			},
		},
		{
			name: "productionDeployHookUrl",
			type: "text",
			label: "Production Deploy Hook URL",
			admin: {
				readOnly: true,
			},
		},
		{
			name: "projectDashboardUrl",
			type: "text",
			label: "Project Dashboard URL",
			admin: {
				readOnly: true,
			},
		},
		{
			name: "projectName",
			type: "text",
			label: "Project Name",
			required: true,
			admin: {
				readOnly: true,
			},
		},
		{
			name: "repositoryUrl",
			type: "text",
			label: "Repository URL",
			admin: {
				readOnly: true,
			},
		},
		// Timestamps are added automatically by Payload
	],
	timestamps: true, // Enable createdAt and updatedAt fields
};
