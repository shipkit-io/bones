import type { CollectionConfig } from "payload";

export const FAQs: CollectionConfig = {
	slug: "faqs",
	admin: {
		useAsTitle: "question",
		defaultColumns: ["question", "category"],
	},
	access: {
		read: () => true,
	},
	timestamps: true,
	fields: [
		{
			name: "question",
			type: "text",
			required: true,
		},
		{
			name: "answer",
			type: "richText",
			required: true,
		},
		{
			name: "category",
			type: "select",
			options: [
				{ label: "General", value: "general" },
				{ label: "Technical", value: "technical" },
				{ label: "Pricing", value: "pricing" },
				{ label: "Support", value: "support" },
			],
		},
		{
			name: "order",
			type: "number",
		},
	],
};
