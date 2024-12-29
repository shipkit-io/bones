"use client";

import { type DialogProps } from "@radix-ui/react-dialog";
import { CircleIcon, FileIcon, LaptopIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";

import { cn } from "@/lib/utils";
import { type MainNavItem, type SidebarNavItem } from "@/types/nav";
import { Moon, Sun } from "lucide-react";

export interface DocsConfig {
	mainNav: MainNavItem[];
	sidebarNav: SidebarNavItem[];
	chartsNav: SidebarNavItem[];
}

export const docsConfig: DocsConfig = {
	mainNav: [
		{
			title: "Documentation",
			href: "/docs",
		},
		{
			title: "Components",
			href: "/docs/components/accordion",
		},
		{
			title: "Blocks",
			href: "/blocks",
		},
		{
			title: "Charts",
			href: "/charts",
		},
		{
			title: "Themes",
			href: "/themes",
		},
		{
			title: "Examples",
			href: "/examples",
		},
		{
			title: "Colors",
			href: "/colors",
		},
	],
	sidebarNav: [
		{
			title: "Getting Started",
			items: [
				{
					title: "Introduction",
					href: "/docs",
					items: [],
				},
				{
					title: "Installation",
					href: "/docs/installation",
					items: [],
				},
				{
					title: "components.json",
					href: "/docs/components-json",
					items: [],
				},
				{
					title: "Theming",
					href: "/docs/theming",
					items: [],
				},
				{
					title: "Dark mode",
					href: "/docs/dark-mode",
					items: [],
				},
				{
					title: "CLI",
					href: "/docs/cli",
					items: [],
				},
				{
					title: "Typography",
					href: "/docs/components/typography",
					items: [],
				},
				{
					title: "Open in v0",
					href: "/docs/v0",
					items: [],
				},
				{
					title: "Figma",
					href: "/docs/figma",
					items: [],
				},
				{
					title: "Changelog",
					href: "/docs/changelog",
					items: [],
				},
			],
		},
		{
			title: "Installation",
			items: [
				{
					title: "Next.js",
					href: "/docs/installation/next",
					items: [],
				},
				{
					title: "Vite",
					href: "/docs/installation/vite",
					items: [],
				},
				{
					title: "Remix",
					href: "/docs/installation/remix",
					items: [],
				},
				{
					title: "Astro",
					href: "/docs/installation/astro",
					items: [],
				},
				{
					title: "Laravel",
					href: "/docs/installation/laravel",
					items: [],
				},
				{
					title: "Gatsby",
					href: "/docs/installation/gatsby",
					items: [],
				},
				{
					title: "Manual",
					href: "/docs/installation/manual",
					items: [],
				},
			],
		},
		{
			title: "Components",
			items: [
				{
					title: "Sidebar",
					href: "/docs/components/sidebar",
					items: [],
					label: "New",
				},
				{
					title: "Accordion",
					href: "/docs/components/accordion",
					items: [],
				},
				{
					title: "Alert",
					href: "/docs/components/alert",
					items: [],
				},
				{
					title: "Alert Dialog",
					href: "/docs/components/alert-dialog",
					items: [],
				},
				{
					title: "Aspect Ratio",
					href: "/docs/components/aspect-ratio",
					items: [],
				},
				{
					title: "Avatar",
					href: "/docs/components/avatar",
					items: [],
				},
				{
					title: "Badge",
					href: "/docs/components/badge",
					items: [],
				},
				{
					title: "Breadcrumb",
					href: "/docs/components/breadcrumb",
					items: [],
				},
				{
					title: "Button",
					href: "/docs/components/button",
					items: [],
				},
				{
					title: "Calendar",
					href: "/docs/components/calendar",
					items: [],
				},
				{
					title: "Card",
					href: "/docs/components/card",
					items: [],
				},
				{
					title: "Carousel",
					href: "/docs/components/carousel",
					items: [],
				},
				{
					title: "Chart",
					href: "/docs/components/chart",
					items: [],
				},
				{
					title: "Checkbox",
					href: "/docs/components/checkbox",
					items: [],
				},
				{
					title: "Collapsible",
					href: "/docs/components/collapsible",
					items: [],
				},
				{
					title: "Combobox",
					href: "/docs/components/combobox",
					items: [],
				},
				{
					title: "Command",
					href: "/docs/components/command",
					items: [],
				},
				{
					title: "Context Menu",
					href: "/docs/components/context-menu",
					items: [],
				},
				{
					title: "Data Table",
					href: "/docs/components/data-table",
					items: [],
				},
				{
					title: "Date Picker",
					href: "/docs/components/date-picker",
					items: [],
				},
				{
					title: "Dialog",
					href: "/docs/components/dialog",
					items: [],
				},
				{
					title: "Drawer",
					href: "/docs/components/drawer",
					items: [],
				},
				{
					title: "Dropdown Menu",
					href: "/docs/components/dropdown-menu",
					items: [],
				},
				{
					title: "Form",
					href: "/docs/components/form",
					items: [],
				},
				{
					title: "Hover Card",
					href: "/docs/components/hover-card",
					items: [],
				},
				{
					title: "Input",
					href: "/docs/components/input",
					items: [],
				},
				{
					title: "Input OTP",
					href: "/docs/components/input-otp",
					items: [],
				},
				{
					title: "Label",
					href: "/docs/components/label",
					items: [],
				},
				{
					title: "Menubar",
					href: "/docs/components/menubar",
					items: [],
				},
				{
					title: "Navigation Menu",
					href: "/docs/components/navigation-menu",
					items: [],
				},
				{
					title: "Pagination",
					href: "/docs/components/pagination",
					items: [],
				},
				{
					title: "Popover",
					href: "/docs/components/popover",
					items: [],
				},
				{
					title: "Progress",
					href: "/docs/components/progress",
					items: [],
				},
				{
					title: "Radio Group",
					href: "/docs/components/radio-group",
					items: [],
				},
				{
					title: "Resizable",
					href: "/docs/components/resizable",
					items: [],
				},
				{
					title: "Scroll Area",
					href: "/docs/components/scroll-area",
					items: [],
				},
				{
					title: "Select",
					href: "/docs/components/select",
					items: [],
				},
				{
					title: "Separator",
					href: "/docs/components/separator",
					items: [],
				},
				{
					title: "Sheet",
					href: "/docs/components/sheet",
					items: [],
				},
				{
					title: "Skeleton",
					href: "/docs/components/skeleton",
					items: [],
				},
				{
					title: "Slider",
					href: "/docs/components/slider",
					items: [],
				},
				{
					title: "Sonner",
					href: "/docs/components/sonner",
					items: [],
				},
				{
					title: "Switch",
					href: "/docs/components/switch",
					items: [],
				},
				{
					title: "Table",
					href: "/docs/components/table",
					items: [],
				},
				{
					title: "Tabs",
					href: "/docs/components/tabs",
					items: [],
				},
				{
					title: "Textarea",
					href: "/docs/components/textarea",
					items: [],
				},
				{
					title: "Toast",
					href: "/docs/components/toast",
					items: [],
				},
				{
					title: "Toggle",
					href: "/docs/components/toggle",
					items: [],
				},
				{
					title: "Toggle Group",
					href: "/docs/components/toggle-group",
					items: [],
				},
				{
					title: "Tooltip",
					href: "/docs/components/tooltip",
					items: [],
				},
			],
		},
	],
	chartsNav: [
		{
			title: "Getting Started",
			items: [
				{
					title: "Introduction",
					href: "/docs/charts",
					items: [],
				},
				{
					title: "Installation",
					href: "/docs/charts/installation",
					items: [],
				},
				{
					title: "Theming",
					href: "/docs/charts/theming",
					items: [],
				},
			],
		},
		{
			title: "Charts",
			items: [
				{
					title: "Area Chart",
					href: "/docs/charts/area",
					items: [],
				},
				{
					title: "Bar Chart",
					href: "/docs/charts/bar",
					items: [],
				},
				{
					title: "Line Chart",
					href: "/docs/charts/line",
					items: [],
				},
				{
					title: "Pie Chart",
					href: "/docs/charts/pie",
					items: [],
				},
				{
					title: "Radar Chart",
					href: "/docs/charts/radar",
					items: [],
				},
				{
					title: "Radial Chart",
					href: "/docs/charts/radial",
					items: [],
				},
			],
		},
		{
			title: "Components",
			items: [
				{
					title: "Tooltip",
					href: "/docs/charts/tooltip",
					items: [],
				},
				{
					title: "Legend",
					href: "/docs/charts/legend",
					items: [],
				},
			],
		},
	],
};

export function CommandMenu({ ...props }: DialogProps) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const { setTheme } = useTheme();

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
				if (
					(e.target instanceof HTMLElement && e.target.isContentEditable) ||
					e.target instanceof HTMLInputElement ||
					e.target instanceof HTMLTextAreaElement ||
					e.target instanceof HTMLSelectElement
				) {
					return;
				}

				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const runCommand = React.useCallback((command: () => unknown) => {
		setOpen(false);
		command();
	}, []);

	return (
		<>
			<Button
				variant="outline"
				className={cn(
					"relative w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-36",
				)}
				size="sm"
				onClick={() => setOpen(true)}
				{...props}
			>
				{/* <span className="hidden lg:inline-flex">Search documentation...</span> */}
				{/* <span className="inline-flex lg:hidden">Search...</span> */}
				<span className="inline-flex text-xs">Search...</span>
				<kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Type a command or search..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Links">
						{docsConfig.mainNav
							.filter((navitem) => !navitem.external)
							.map((navItem) => (
								<CommandItem
									key={navItem.href}
									value={navItem.title}
									onSelect={() => {
										runCommand(() => router.push(navItem.href as string));
									}}
								>
									<FileIcon className="mr-2 h-4 w-4" />
									{navItem.title}
								</CommandItem>
							))}
					</CommandGroup>
					{docsConfig.sidebarNav.map((group) => (
						<CommandGroup key={group.title} heading={group.title}>
							{group.items.map((navItem) => (
								<CommandItem
									key={navItem.href}
									value={navItem.title}
									onSelect={() => {
										runCommand(() => router.push(navItem.href as string));
									}}
								>
									<div className="mr-2 flex h-4 w-4 items-center justify-center">
										<CircleIcon className="h-3 w-3" />
									</div>
									{navItem.title}
								</CommandItem>
							))}
						</CommandGroup>
					))}
					<CommandSeparator />
					<CommandGroup heading="Theme">
						<CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
							<Sun className="mr-2 h-4 w-4" />
							Light
						</CommandItem>
						<CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
							<Moon className="mr-2 h-4 w-4" />
							Dark
						</CommandItem>
						<CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
							<LaptopIcon className="mr-2 h-4 w-4" />
							System
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
}
