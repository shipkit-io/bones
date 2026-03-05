import type { Block } from "payload";

/*
 * Content Block
 * A flexible rich text content section using the Lexical editor
 */
export const ContentBlock: Block = {
	slug: "content",
	labels: {
		singular: "Content Section",
		plural: "Content Sections",
	},
	fields: [
		{
			name: "content",
			type: "richText",
			required: true,
			admin: {
				description: "The main content for this section",
			},
		},
		{
			name: "width",
			type: "select",
			defaultValue: "default",
			options: [
				{
					label: "Default",
					value: "default",
				},
				{
					label: "Wide",
					value: "wide",
				},
				{
					label: "Narrow",
					value: "narrow",
				},
			],
			admin: {
				description: "Choose the width of the content container",
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
					label: "Light Gray",
					value: "gray",
				},
				{
					label: "Accent",
					value: "accent",
				},
			],
			admin: {
				description: "Choose a background style for this section",
			},
		},
	],
};
