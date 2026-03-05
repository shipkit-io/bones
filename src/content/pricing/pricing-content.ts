import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";

export interface PricingPlan {
	title: string;
	description: string;
	price: {
		monthly?: number;
		annually?: number;
		oneTime?: number;
	};
	features: string[];
	infos?: string[];
	href: string;
	isBestValue?: boolean;
	noCardRequired?: boolean;
	isComingSoon?: boolean;
}

export const singlePlan: PricingPlan = {
	title: "Shipkit",
	description: "Production-ready, for teams that need advanced features",
	price: { oneTime: 249 },
	href: routes.external.buy,
	features: [
		"Next.js 15 App Router",
		"Authentication (NextAuth v5)",
		"Cursor IDE Integration (Rules, Prompts, etc.)",
		"Database Integration (Postgres)",
		"Email Service (Resend)",
		"Payment Processing (Lemonsqueezy)",
		"CMS Integration (PayloadCMS)",
		"Priority Support",
		"AI Workflows + v0.dev Integration",
		"100+ Components",
	],
};

export const oneTimePlans: PricingPlan[] = [
	{
		title: "Shipkit Bones",
		description: "Perfect for indie developers and small projects",
		price: { oneTime: 0 },
		href: routes.external.buy,
		features: [
			"Next.js 15 App Router Setup",
			"Authentication (NextAuth v5)",
			"TypeScript Configuration",
			"Basic UI Components",
			"Basic Testing Setup",
			"Community Support",
		],
		noCardRequired: true,
	},
	// Removed Muscles tier; consolidating to Bones (free) and Brains (paid)
	{
		title: "Shipkit",
		description: "Production-ready, for teams that need advanced features",
		price: { oneTime: 249 },
		href: routes.external.buy,
		features: [
			"Everything in Bones +",
			"Database Integration (Postgres)",
			"Email Service (Resend)",
			"Payment Processing",
			"CMS Integration",
			"Priority Support",
			"AI Workflows",
			"Advanced Components",
		],
		isBestValue: true,
	},
];

export const subscriptionPlans: PricingPlan[] = [
	{
		title: "Shipkit Plus",
		description: "For small teams",
		price: {
			monthly: 19,
			annually: 9,
		},
		features: ["10 users included", "2 GB of storage", "Email support"],
		infos: ["30 users included", "15 GB of storage", "Phone and email support"],
		href: "#",
	},
	{
		title: "Shipkit Pro",
		description: "For medium-sized businesses",
		price: {
			monthly: 49,
			annually: 39,
		},
		features: ["20 users included", "10 GB of storage", "Priority email support"],
		infos: ["50 users included", "30 GB of storage", "Phone and email support"],
		href: "#",
		isBestValue: true,
	},
	{
		title: "Enterprise",
		description: "For large enterprises",
		price: {
			monthly: 99,
			annually: 79,
		},
		features: ["50 users included", "30 GB of storage", "Phone & email support"],
		infos: ["100 users included", "60 GB of storage", "24/7 support"],
		href: "#",
	},
];
