import type { MouseEvent, ReactNode } from "react";
import type { Registry, RegistryFilters, RegistryItem } from "../_lib/types";

export type StyleMode = "brutalist" | "modern" | "minimalist";
export type PreviewMode = "none" | "single" | "all";

export interface ComponentCardProps {
	component: RegistryItem;
	currentStyle: StyleMode;
	onOpenSidebar: (component: RegistryItem) => void;
	showPreview?: boolean;
	showAllVariants?: boolean;
}

export interface ActionButtonProps {
	icon: ReactNode;
	tooltip: string;
	onClick: (e: MouseEvent<HTMLButtonElement>) => void;
	currentStyle: StyleMode;
}

export interface BrowserHeaderProps {
	currentStyle: StyleMode;
	registries: Registry[];
	currentRegistry?: Registry;
	onRegistryChange: (registry: Registry) => void;
}

export interface BrowserSidebarProps {
	currentStyle: StyleMode;
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	filters: RegistryFilters;
	setFilters: (filters: RegistryFilters) => void;
	categories: string[];
	types: string[];
}

export interface InstallationProgress {
	status: "idle" | "installing" | "success" | "error";
	message?: string;
	log?: string;
}

export interface PreviewProps {
	component: RegistryItem;
	currentStyle: StyleMode;
}

export interface ComponentDetailsProps {
	component: RegistryItem;
	currentStyle?: StyleMode;
	currentRegistry?: Registry;
	onClose: () => void;
	installationProgress: InstallationProgress;
	onInstall: (component: RegistryItem) => void;
	onHideInstallation: () => void;
}
