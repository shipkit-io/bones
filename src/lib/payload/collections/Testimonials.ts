import type { CollectionConfig } from "payload";

export const Testimonials: CollectionConfig = {
	slug: "testimonials",
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name", "company", "verified"],
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: false,
		},
		{
			name: "role",
			type: "text",
			required: false,
		},
		{
			name: "company",
			type: "text",
			required: false,
		},
		{
			name: "testimonial",
			type: "textarea",
			required: true,
		},
		{
			name: "username",
			type: "text",
		},
		{
			name: "verified",
			type: "checkbox",
			defaultValue: false,
		},
		{
			name: "featured",
			type: "checkbox",
			defaultValue: false,
		},
		{
			name: "image",
			type: "upload",
			relationTo: "media",
			required: false,
		},
	],
};
