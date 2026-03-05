import type { Block } from "payload";

/*
 * Hero Block
 * A full-width hero section with heading, subheading, image, and CTA
 */
export const HeroBlock: Block = {
	slug: "hero",
	labels: {
		singular: "Hero Section",
		plural: "Hero Sections",
	},
	fields: [
		{
			name: "heading",
			type: "text",
			required: true,
			admin: {
				description: "The main heading for this section",
			},
		},
		{
			name: "subheading",
			type: "textarea",
			admin: {
				description: "Optional subheading text",
			},
		},
		{
			name: "image",
			type: "upload",
			relationTo: "media",
			admin: {
				description: "Background or featured image",
			},
		},
		{
			name: "ctaText",
			type: "text",
			label: "Call to Action Text",
			admin: {
				description: "Text for the call-to-action button",
			},
		},
		{
			name: "ctaLink",
			type: "text",
			label: "Call to Action Link",
			admin: {
				description: "URL or path for the call-to-action button",
			},
		},
		{
			name: "style",
			type: "select",
			defaultValue: "default",
			options: [
				{
					label: "Default",
					value: "default",
				},
				{
					label: "Centered",
					value: "centered",
				},
				{
					label: "Split",
					value: "split",
				},
			],
			admin: {
				description: "Choose the layout style for this hero section",
			},
		},
	],
};
