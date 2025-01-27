"use client";

import { NavMain } from "@/components/blocks/nav-main";
import { NavSecondary } from "@/components/blocks/nav-secondary";
import { FeedbackDialog } from "@/components/ui/feedback-dialog";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import {
	Download,
	LifeBuoy,
	Send,
	Settings2,
	SquareTerminal,
	Wrench,
} from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

// Helper function to determine if a route is active
const isRouteActive = (currentPath: string, itemPath: string) => {
	if (itemPath === "#") return false;
	return currentPath.startsWith(itemPath);
};

// Helper function to determine if a group should be expanded
const shouldGroupExpand = (
	currentPath: string,
	items: Array<{ url: string }> = [],
) => {
	return items.some((item) => isRouteActive(currentPath, item.url));
};

// Navigation data with proper typing
const SIDEBAR_DATA = {
	navMain: [
		{
			title: "Dashboard",
			url: routes.dashboard,
			icon: SquareTerminal,
		},
		{
			title: "Manage",
			icon: Settings2,
			items: [
				{ title: "Projects", url: routes.projects },
				{ title: "Teams", url: routes.teams },
				{ title: "API Keys", url: routes.apiKeys },
			],
		},
		{
			title: `Download ${siteConfig.name}`,
			url: "/download",
			icon: Download,
		},
		{
			title: "Tools",
			url: "/tools",
			icon: Wrench,
		},
	],
	navSecondary: [
		{
			title: "Documentation",
			icon: LifeBuoy,
			url: routes.docs,
		},
		{
			title: "Feedback",
			icon: Send,
			url: "#feedback",
			component: FeedbackDialog,
		},
		{
			title: "Settings",
			icon: Settings2,
			url: routes.app.settings,
		},
	],
};

export function AppSidebarClient() {
	const pathname = usePathname();

	// Enhance the navigation data with active states
	const enhancedNavMain = SIDEBAR_DATA.navMain.map((item) => ({
		...item,
		isActive: item.url ? isRouteActive(pathname, item.url) : false,
		isExpanded: item.items ? shouldGroupExpand(pathname, item.items) : false,
	}));

	return (
		<>
			<NavMain items={enhancedNavMain} />
			<div className="mt-auto flex flex-col gap-2">
				<NavSecondary items={SIDEBAR_DATA.navSecondary} />
			</div>
		</>
	);
}
