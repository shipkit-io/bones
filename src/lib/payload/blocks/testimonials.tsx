import type { Block } from "payload";

/*
 * Testimonials Block
 * Display customer testimonials in various layouts
 */
export const TestimonialsBlock: Block = {
	slug: "testimonials",
	labels: {
		singular: "Testimonials Section",
		plural: "Testimonials Sections",
	},
	fields: [
		{
			name: "heading",
			type: "text",
			admin: {
				description: "Optional section heading",
			},
		},
		{
			name: "testimonials",
			type: "relationship",
			relationTo: "testimonials",
			hasMany: true,
			required: true,
			admin: {
				description: "Select testimonials to display in this section",
			},
		},
		{
			name: "layout",
			type: "select",
			defaultValue: "grid",
			options: [
				{
					label: "Grid",
					value: "grid",
				},
				{
					label: "Slider",
					value: "slider",
				},
				{
					label: "Single",
					value: "single",
				},
			],
			admin: {
				description: "Choose how to display the testimonials",
			},
		},
		{
			name: "background",
			type: "select",
			defaultValue: "none",
			options: [
				{
					label: "None",
					value: "none",
				},
				{
					label: "Light",
					value: "light",
				},
				{
					label: "Dark",
					value: "dark",
				},
			],
			admin: {
				description: "Choose a background style for this section",
			},
		},
	],
};
