import type { Block } from "payload";

/*
 * Features Block
 * Display a curated list of features with customizable layout
 */
export const FeaturesBlock: Block = {
	slug: "features",
	labels: {
		singular: "Features Section",
		plural: "Features Sections",
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
			name: "features",
			type: "relationship",
			relationTo: "features",
			hasMany: true,
			required: true,
			admin: {
				description: "Select features to display in this section",
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
					label: "List",
					value: "list",
				},
				{
					label: "Carousel",
					value: "carousel",
				},
			],
			admin: {
				description: "Choose how to display the features",
			},
		},
		{
			name: "columns",
			type: "select",
			defaultValue: "3",
			options: [
				{
					label: "Two Columns",
					value: "2",
				},
				{
					label: "Three Columns",
					value: "3",
				},
				{
					label: "Four Columns",
					value: "4",
				},
			],
			admin: {
				description: "Number of columns in grid layout",
				condition: (data, siblingData) => siblingData?.layout === "grid",
			},
		},
	],
};
