"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckIcon, Cross2Icon, ReloadIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { CopyIcon, Download } from "lucide-react";
import {
	type MouseEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
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

const copyToClipboard = (text: string) => {
	navigator.clipboard.writeText(text);
	toast({
		title: "Copied to clipboard",
		description: "The content has been copied to your clipboard.",
	});
};

const ActionButton = ({
	icon,
	tooltip,
	onClick,
	currentStyle,
}: ActionButtonProps) => (
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
	const registryColor = getColor(component.registry || "default");
	const categoryColor = getColor(component.categories?.[0] || "default");

	return (
		<Card
			key={component.name}
			className={cn(
				componentCardStyles({ style: currentStyle }),
				"relative min-h-[150px] overflow-hidden bg-card text-card-foreground",
				isInstalled &&
					(currentStyle === "brutalist"
						? "border-2 border-emerald-500"
						: "border border-emerald-500/50"),
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
					<CardTitle className="text-base font-bold">
						{component.name}
					</CardTitle>
					<div className="flex items-center gap-2">
						<ActionButton
							icon={<CopyIcon className="h-4 w-4" />}
							tooltip="Copy install command"
							onClick={(e) => {
								e.stopPropagation();
								const installCommand = getInstallCommand(
									component,
									currentRegistry,
								);
								navigator.clipboard.writeText(installCommand);
								toast({
									title: "Copied to clipboard",
									description:
										"Install command has been copied to your clipboard.",
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
							: "rounded-full border border-muted-foreground text-xs",
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

export function ComponentBrowser({
	currentStyle: initialStyle = "modern",
}: ComponentBrowserProps) {
	const [currentStyle, setCurrentStyle] = useState<StyleMode>(initialStyle);
	const [selectedComponent, setSelectedComponent] =
		useState<RegistryItem | null>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [installationProgress, setInstallationProgress] =
		useState<InstallationProgress>({
			status: "idle",
		});
	const [installedComponents, setInstalledComponents] = useState<string[]>([]);
	const [showInstallation, setShowInstallation] = useState(false);
	const [overwrite, setOverwrite] = useState(false);
	const sidebarRef = useRef<HTMLDivElement>(null);

	const {
		registries,
		currentRegistry,
		items,
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
		checkInstallations();
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				sidebarRef.current &&
				!sidebarRef.current.contains(event.target as Node)
			) {
				setSelectedComponent(null);
				setIsSidebarOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside as any);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside as any);
		};
	}, []);

	const toggleStyle = () => {
		setCurrentStyle((prev) => (prev === "brutalist" ? "modern" : "brutalist"));
	};

	const openSidebar = (component: RegistryItem) => {
		setSelectedComponent(component);
		setIsSidebarOpen(true);
	};

	const closeSidebar = () => {
		setSelectedComponent(null);
		setIsSidebarOpen(false);
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
				description: "Could not find registry for component",
				variant: "destructive",
			});
			return;
		}

		const installCommand = getInstallCommand(component, registry);
		const componentUrl = installCommand.split('"')[1]; // Extract URL from command
		if (!componentUrl) {
			toast({
				title: "Error",
				description: "Could not parse install command",
				variant: "destructive",
			});
			return;
		}

		setInstallationProgress({ status: "installing" });
		installComponent(componentUrl, { overwrite })
			.then(async (stream) => {
				let log = "";
				const reader = stream.getReader();
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					log += new TextDecoder().decode(value);
					setInstallationProgress({
						status: "installing",
						log,
					});
				}
				setInstallationProgress({
					status: "success",
					log,
					message: "Component installed successfully!",
				});
				const components = await getInstalledComponents();
				setInstalledComponents(components);
			})
			.catch((error) => {
				setInstallationProgress({
					status: "error",
					message:
						error instanceof Error
							? error.message
							: "Failed to install component",
				});
			});
	};

	const hideInstallation = () => {
		setInstallationProgress({ status: "idle" });
	};

	const renderComponentGrid = (registry: string) => {
		const allFilteredItems = filteredItems();
		console.log("Registry:", registry, "Filtered Items:", allFilteredItems); // Debug log
		return (
			<div
				className={cn(
					"p-4",
					"grid grid-cols-1 gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-3",
				)}
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
			className={`${containerStyles({ style: currentStyle })} relative h-full bg-background text-foreground`}
		>
			<BrowserHeader
				currentStyle={currentStyle}
				registries={registries}
				currentRegistry={currentRegistry}
				onRegistryChange={setCurrentRegistry}
				overwrite={overwrite}
				onOverwriteChange={setOverwrite}
				onAddRegistry={async (registry: Registry) => {
					try {
						const registryWithCustom = { ...registry, custom: true };
						await addCustomRegistry(registryWithCustom);
						setRegistries((prev: Registry[]) => [...prev, registryWithCustom]);
						setCurrentRegistry(registryWithCustom);
					} catch (error) {
						toast({
							title: "Failed to add registry",
							description:
								error instanceof Error
									? error.message
									: "Unknown error occurred",
							variant: "destructive",
						});
					}
				}}
				onRemoveRegistry={(name: string) => {
					try {
						removeCustomRegistry(name);
						const updatedRegistries = registries.filter((r) => r.name !== name);
						setRegistries(updatedRegistries);
						if (currentRegistry?.name === name) {
							const defaultRegistry =
								updatedRegistries.find((r) => !r.custom) ||
								updatedRegistries[0];
							if (defaultRegistry) {
								setCurrentRegistry(defaultRegistry);
							}
						}
					} catch (error) {
						toast({
							title: "Failed to remove registry",
							description:
								error instanceof Error
									? error.message
									: "Unknown error occurred",
							variant: "destructive",
						});
					}
				}}
				onStyleChange={toggleStyle}
			/>
			<div className="relative flex flex-1 flex-col overflow-hidden md:flex-row">
				<BrowserSidebar
					currentStyle={currentStyle}
					searchTerm={searchQuery}
					setSearchTerm={setSearchQuery}
					filters={filters}
					setFilters={setFilters}
					categories={getCategories()}
					types={getTypes()}
					filteredItems={filteredItems()}
				/>
				<div className="flex-1 overflow-auto">
					{loading ? (
						<div className="flex h-full items-center justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
						</div>
					) : (
						<div className="space-y-8">{renderComponentGrid("all")}</div>
					)}
				</div>
			</div>

			{/* Installation output overlay */}
			{installationProgress.status !== "idle" && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					className="fixed bottom-4 right-4 z-50 w-[500px]"
				>
					<Card className="border-black/10 bg-[#1E1E1E] shadow-2xl">
						<div className="relative">
							<div className="flex h-8 items-center justify-between rounded-t-lg bg-[#323233] px-3">
								<div className="absolute left-3 flex items-center gap-2 text-xs">
									{installationProgress.status === "installing" ? (
										<div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-2 py-1 text-blue-400">
											<ReloadIcon className="h-3 w-3 animate-spin" />
											Installing...
										</div>
									) : installationProgress.status === "success" ? (
										<div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-400">
											<CheckIcon className="h-3 w-3" />
											Complete
										</div>
									) : (
										<div className="flex items-center gap-2 rounded-full bg-red-500/10 px-2 py-1 text-red-400">
											<Cross2Icon className="h-3 w-3" />
											Error
										</div>
									)}
								</div>
								<span className="w-full text-center text-xs font-medium text-zinc-400">
									Console Output
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-1 top-1 z-10 h-6 w-6 p-0 text-zinc-400 hover:text-zinc-300"
									onClick={hideInstallation}
									disabled={installationProgress.status === "installing"}
								>
									<Cross2Icon className="h-4 w-4" />
								</Button>
							</div>
							<div className="pt-8">
								{installationProgress.log ? (
									<Terminal
										output={installationProgress.log.split("\n")}
										className="h-[300px] rounded-b-lg"
									/>
								) : (
									<div className="flex h-[300px] items-center justify-center text-zinc-400">
										<ReloadIcon className="h-6 w-6 animate-spin" />
									</div>
								)}
							</div>
						</div>
					</Card>
				</motion.div>
			)}

			{selectedComponent && (
				<ComponentDetails
					component={selectedComponent}
					currentStyle={currentStyle}
					currentRegistry={currentRegistry}
					onClose={closeSidebar}
					installationProgress={installationProgress}
					onInstall={handleInstall}
					onHideInstallation={hideInstallation}
				/>
			)}
		</div>
	);
}
