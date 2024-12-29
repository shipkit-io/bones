import { routes } from "@/config/routes";
import { type MainNavItem } from "@/types/nav";

export const mainNav: MainNavItem[] = [
	{
		title: "Features",
		href: routes.features,
	},
	{
		title: "Pricing",
		href: routes.pricing,
	},
	{
		title: "Documentation",
		href: routes.docs,
	},
];

export const dashboardNav: MainNavItem[] = [
	{
		title: "Dashboard",
		href: routes.app.dashboard,
	},
	{
		title: "Settings",
		href: routes.app.settings,
	},
];

export const settingsNav: MainNavItem[] = [
	{
		title: "General",
		href: routes.app.settings,
		icon: "next",
	},
	{
		title: "Account",
		href: `${routes.app.settings}/account`,
		icon: "github",
	},
	{
		title: "Security",
		href: `${routes.app.settings}/security`,
		icon: "shadcn",
	},
	{
		title: "Preferences",
		href: `${routes.app.settings}/preferences`,
		icon: "react",
	},
];
