import type { Icons } from "@/components/assets/icons";

export interface NavItem {
	title: string;
	href?: string;
	disabled?: boolean;
	external?: boolean;
	icon?: keyof typeof Icons;
	label?: string;
}

export interface NavItemWithChildren extends NavItem {
	items: NavItemWithChildren[];
}

export type MainNavItem = NavItem;
export type SidebarNavItem = NavItemWithChildren;
