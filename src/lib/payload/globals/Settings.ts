import type { GlobalConfig } from "payload";

export interface SettingsGlobal {
	seedCompleted: boolean;
	seedCompletedAt: string;
	siteTitle: string;
	siteDescription?: string;
}

/*
 * Settings Global
 * This global is used to store application-wide settings
 * Including seeding status to prevent reseeding on every initialization
 */
export const Settings: GlobalConfig = {
	slug: "settings",
	access: {
		read: () => true,
	},
	fields: [
		{
			name: "seedCompleted",
			type: "checkbox",
			defaultValue: false,
			admin: {
				description: "Indicates whether initial data seeding has been completed",
				position: "sidebar",
			},
		},
		{
			name: "seedCompletedAt",
			type: "date",
			admin: {
				description: "When the initial data seeding was completed",
				position: "sidebar",
			},
		},
		{
			name: "siteTitle",
			type: "text",
			defaultValue: "Shipkit",
			admin: {
				description: "The title of the site used in various places",
			},
		},
		{
			name: "siteDescription",
			type: "textarea",
			admin: {
				description: "A brief description of the site used for SEO",
			},
		},
	],
};
