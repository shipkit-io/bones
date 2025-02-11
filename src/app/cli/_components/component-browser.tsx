"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckIcon, Cross2Icon, ReloadIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { CopyIcon, Download } from "lucide-react";
import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { installComponent } from "../_actions/install";
import { getInstalledComponents } from "../_actions/registry";
import { useRegistry } from "../_hooks/use-registry";
import {
	addCustomRegistry,
	getInstallCommand,
	removeCustomRegistry,
} from "../_lib/registry-service";
import type { Registry, RegistryItem } from "../_lib/types";
import { BrowserHeader } from "./browser-header";
import { BrowserSidebar } from "./browser-sidebar";
import { getColor } from "./colors";
import { ComponentDetails } from "./component-details";
import { buttonStyles, componentCardStyles, containerStyles } from "./styles";
import { Terminal } from "./terminal";
import type { InstallationProgress, StyleMode } from "./types";

interface ComponentCardProps {
	component: RegistryItem;
	currentStyle: StyleMode;
	currentRegistry?: Registry;
	onOpenSidebar: (component: RegistryItem) => void;
	showPreview?: boolean;
	showAllVariants?: boolean;
	onInstall: (component: RegistryItem) => void;
	isInstalled: boolean;
}

interface ActionButtonProps {
	icon: ReactNode;
	tooltip: string;
	onClick: (e: MouseEvent<HTMLButtonElement>) => void;
	currentStyle: StyleMode;
}

interface ComponentBrowserProps {
	currentStyle?: StyleMode;
}

const _copyToClipboard = (text: string) => {
	navigator.clipboard.writeText(text);
	toast({
		title: "Copied to clipboard",
		description: "The content has been copied to your clipboard.",
	});
};

const ActionButton = ({ icon, tooltip, onClick, currentStyle }: ActionButtonProps) => (
	<TooltipProvider delayDuration={0}>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className={buttonStyles({ style: currentStyle })}
					onClick={onClick}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{tooltip}</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
);

const ComponentCard = ({
	component,
	currentStyle,
	currentRegistry,
	onOpenSidebar,
	showPreview,
	onInstall,
	isInstalled,
}: ComponentCardProps) => {
	const registryColor = getColor(component.registry ?? "default");
	const categoryColor = getColor(component.categories?.[0] ?? "default");

	return (
		<Card
			key={component.name}
			className={cn(
				componentCardStyles({ style: currentStyle }),
				"relative min-h-[150px] overflow-hidden bg-card text-card-foreground",
				isInstalled &&
					(currentStyle === "brutalist"
						? "border-2 border-emerald-500"
						: "border border-emerald-500/50")
			)}
			onClick={() => onOpenSidebar(component)}
		>
			<div
				className="absolute left-0 top-0 h-0 w-0 border-8 border-transparent"
				style={{
					borderTopColor: registryColor,
					borderLeftColor: registryColor,
				}}
			/>
			{/* <div className="absolute top-0 right-0 w-0 h-0 border-8 border-transparent" style={{ borderTopColor: categoryColor, borderRightColor: categoryColor }} /> */}
			{isInstalled && (
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="absolute bottom-0 right-0 h-0 w-0 cursor-help border-8 border-transparent border-b-emerald-500 border-r-emerald-500" />
						</TooltipTrigger>
						<TooltipContent side="left">
							<p className="text-xs">Installed</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
			<CardHeader className="pb-2">
				<div className="mb-2 flex items-start justify-between">
					<CardTitle className="text-base font-bold">{component.name}</CardTitle>
					<div className="flex items-center gap-2">
						<ActionButton
							icon={<CopyIcon className="h-4 w-4" />}
							tooltip="Copy install command"
							onClick={(e) => {
								e.stopPropagation();
								const installCommand = getInstallCommand(component, currentRegistry);
								navigator.clipboard.writeText(installCommand);
								toast({
									title: "Copied to clipboard",
									description: "Install command has been copied to your clipboard.",
								});
							}}
							currentStyle={currentStyle}
						/>
						{showPreview && (
							<ActionButton
								icon={<Download className="h-4 w-4" />}
								tooltip="Install component"
								onClick={(e) => {
									e.stopPropagation();
									onInstall(component);
								}}
								currentStyle={currentStyle}
							/>
						)}
					</div>
				</div>
				<Badge
					variant="outline"
					className={cn(
						"mt-1 hidden w-auto self-start md:inline-flex",
						currentStyle === "brutalist"
							? "rounded-none border-2 border-primary"
							: "rounded-full border border-muted-foreground text-xs"
					)}
					style={{ backgroundColor: `${categoryColor}70`, color: "#fff" }}
				>
					{component.type === "registry:ui" ? "Component" : "Block"}
				</Badge>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">{component.description}</p>
			</CardContent>
		</Card>
	);
};

export function ComponentBrowser({ currentStyle: initialStyle = "modern" }: ComponentBrowserProps) {
	const [currentStyle, setCurrentStyle] = useState<StyleMode>(initialStyle);
	const [selectedComponent, setSelectedComponent] = useState<RegistryItem | null>(null);
	const [installationProgress, setInstallationProgress] = useState<InstallationProgress>({
		status: "idle",
	});
	const [installedComponents, setInstalledComponents] = useState<string[]>([]);
	const [overwrite, setOverwrite] = useState(false);
	const sidebarRef = useRef<HTMLDivElement>(null);

	const {
		registries,
		currentRegistry,
		loading,
		error,
		filters,
		searchQuery,
		setCurrentRegistry: setCurrentRegistryBase,
		setFilters,
		setSearchQuery,
		getCategories,
		getTypes,
		setRegistries,
		filteredItems,
	} = useRegistry();

	// Wrap setCurrentRegistry to handle null case
	const setCurrentRegistry = (registry: Registry | null) => {
		setCurrentRegistryBase(registry || undefined);
	};

	useEffect(() => {
		const checkInstallations = async () => {
			const components = await getInstalledComponents();
			setInstalledComponents(components);
		};
		void checkInstallations();
	}, []);

	// Type-safe event handler
	const handleClickOutside = useCallback((event: globalThis.MouseEvent) => {
		if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
			setSelectedComponent(null);
		}
	}, []);

	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [handleClickOutside]);

	const toggleStyle = () => {
		setCurrentStyle((prev) => (prev === "brutalist" ? "modern" : "brutalist"));
	};

	const openSidebar = (component: RegistryItem) => {
		setSelectedComponent(component);
	};

	const closeSidebar = () => {
		setSelectedComponent(null);
		setInstallationProgress({ status: "idle" });
	};

	const handleInstall = (component: RegistryItem) => {
		// Find the registry for this component
		const registryName = component.registry;
		if (!registryName) {
			toast({
				title: "Error",
				description: "Component has no registry specified",
				variant: "destructive",
			});
			return;
		}

		const registry = registries.find((r) => r.name === registryName);
		if (!registry) {
			toast({
				title: "Error",
				description: "Registry not found",
				variant: "destructive",
			});
			return;
		}

		setSelectedComponent(component);
		setInstallationProgress({ status: "installing" });

		void (async () => {
			try {
				const stream = await installComponent(component.name, {
					overwrite,
					style: currentStyle,
				});

				const reader = stream.getReader();
				let log = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const text = new TextDecoder().decode(value);
					log += text;
					setInstallationProgress((prev) => ({
						...prev,
						log,
					}));
				}

				const components = await getInstalledComponents();
				setInstalledComponents(components);

				setInstallationProgress({
					status: "success",
					log,
				});
			} catch (error) {
				setInstallationProgress({
					status: "error",
					log: error instanceof Error ? error.message : "Unknown error occurred",
				});
			}
		})();
	};

	const hideInstallation = () => {
		setInstallationProgress({ status: "idle" });
	};

	const renderComponentGrid = (_registry: string) => {
		const allFilteredItems = filteredItems();

		return (
			<div
				className={cn("p-4", "grid grid-cols-1 gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-3")}
			>
				{allFilteredItems.map((component: RegistryItem) => (
					<ComponentCard
						key={component.name}
						component={component}
						currentStyle={currentStyle}
						currentRegistry={currentRegistry}
						onOpenSidebar={openSidebar}
						onInstall={handleInstall}
						isInstalled={installedComponents.includes(component.name)}
						showPreview={true}
					/>
				))}
			</div>
		);
	};

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 text-2xl font-bold text-destructive">Error</h2>
					<p className="text-muted-foreground">{error.message}</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`${containerStyles({ style: currentStyle })} relative h-full bg-background text-foreground`
