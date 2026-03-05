import { routes } from "@/config/routes";
import type { MainNavItem, SidebarNavItem } from "@/types/nav";

export interface DocsConfig {
	mainNav: MainNavItem[];
	sidebarNav: SidebarNavItem[];
	featuresNav: SidebarNavItem[];
}

export const docsConfig: DocsConfig = {
	mainNav: [
		{
			title: "Documentation",
			href: routes.docs,
		},
		// Only include blog link when blog is enabled
		...(process.env.NEXT_PUBLIC_HAS_BLOG === "true"
			? [{ title: "Blog", href: routes.blog }]
			: []),
		{
			title: "Examples",
			href: routes.examples.index,
		},
		{
			title: "Pricing",
			href: routes.pricing,
		},
		{
			title: "Contact",
			href: routes.contact,
		},
	],
	sidebarNav: [
		{
			title: "Getting Started",
			items: [
				{
					title: "Introduction",
					href: routes.docs,
					items: [],
				},
				{
					title: "Installation",
					href: `${routes.docs}/installation`,
					items: [],
				},
				{
					title: "Quick Start",
					href: `${routes.docs}/quick-start`,
					items: [],
				},
				{
					title: "Deployment",
					href: `${routes.docs}/deployment`,
					items: [],
				},
				{
					title: "Environment Variables",
					href: `${routes.docs}/env`,
					items: [],
				},
				{
					title: "Authentication",
					href: `${routes.docs}/auth`,
					items: [],
				},
				{
					title: "Integrations",
					href: `${routes.docs}/integrations`,
					items: [],
					label: "Updated",
				},
				{
					title: "FAQ",
					href: routes.faq,
					items: [],
				},
				{
					title: "Changelog",
					href: `${routes.docs}/changelog`,
					items: [],
				},
			],
		},
		{
			title: "Features",
			items: [
				{
					title: "Dashboard",
					href: `${routes.docs}/features/dashboard`,
					items: [],
				},
				{
					title: "Authentication",
					href: `${routes.docs}/features/authentication`,
					items: [],
				},
				{
					title: "CMS Integration",
					href: `${routes.docs}/features/cms`,
					items: [],
				},
				{
					title: "Builder.io",
					href: `${routes.docs}/features/builder`,
					items: [],
				},
				{
					title: "Payload CMS",
					href: `${routes.docs}/features/payload`,
					items: [],
				},
				{
					title: "API Keys",
					href: `${routes.docs}/features/api-keys`,
					items: [],
				},
				{
					title: "Activity Logging",
					href: `${routes.docs}/features/activity`,
					items: [],
				},
				{
					title: "Network Monitoring",
					href: `${routes.docs}/features/network`,
					items: [],
				},
				{
					title: "Teams",
					href: `${routes.docs}/features/teams`,
					items: [],
				},
				{
					title: "Projects",
					href: `${routes.docs}/features/projects`,
					items: [],
				},
			],
		},
		{
			title: "Components",
			items: [
				{
					title: "UI Components",
					href: `${routes.docs}/components/ui`,
					items: [],
				},
				{
					title: "Data Display",
					href: `${routes.docs}/components/data-display`,
					items: [],
				},
				{
					title: "Forms",
					href: `${routes.docs}/components/forms`,
					items: [],
				},
				{
					title: "Navigation",
					href: `${routes.docs}/components/navigation`,
					items: [],
				},
				{
					title: "Layout",
					href: `${routes.docs}/components/layout`,
					items: [],
				},
				{
					title: "Feedback",
					href: `${routes.docs}/components/feedback`,
					items: [],
				},
				{
					title: "Data Tables",
					href: `${routes.docs}/components/data-tables`,
					items: [],
				},
				{
					title: "Charts",
					href: `${routes.docs}/components/charts`,
					items: [],
				},
			],
		},
	],
	featuresNav: [
		{
			title: "Core Features",
			items: [
				{
					title: "Authentication",
					href: routes.examples.authentication,
					items: [],
				},
				{
					title: "Dashboard",
					href: routes.examples.dashboard,
					items: [],
				},
				{
					title: "Forms",
					href: routes.examples.forms,
					items: [],
				},
				{
					title: "Deployments",
					href: routes.app.deployments,
					items: [],
				},
			],
		},
		{
			title: "Integrations",
			items: [
				{
					title: "Payload CMS",
					href: routes.demo.payloadCms,
					items: [],
				},
				{
					title: "Builder.io",
					href: routes.demo.builderio,
					items: [],
				},
				{
					title: "TRPC",
					href: routes.demo.trpc,
					items: [],
				},
				{
					title: "Network Monitoring",
					href: routes.demo.network,
					items: [],
				},
			],
		},
		{
			title: "AI Features",
			items: [
				{
					title: "AI Overview",
					href: routes.ai.index,
					items: [],
				},
				{
					title: "Code Completion",
					href: routes.ai.codeCompletion,
					items: [],
				},
				{
					title: "Semantic Search",
					href: routes.ai.semanticSearch,
					items: [],
				},
				{
					title: "Report Generation",
					href: routes.ai.reportGen,
					items: [],
				},
			],
		},
	],
};
