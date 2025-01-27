import { ProjectsList } from "@/app/(app)/(dashboard)/projects/_components/projects-list";
import { NavUser } from "@/components/blocks/nav-user";
import { TeamSwitcher } from "@/components/blocks/team-switcher";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

const appSidebarVariants = cva("", {
	variants: {
		variant: {
			sidebar: "",
			inset: "bg-muted/50",
			floating: "shadow-lg",
		},
		size: {
			default: "w-64",
			sm: "w-48",
			lg: "w-72",
		},
	},
	defaultVariants: {
		variant: "sidebar",
		size: "default",
	},
});

interface AppSidebarProps
	extends Omit<React.ComponentProps<typeof Sidebar>, "variant">,
	VariantProps<typeof appSidebarVariants> {
	variant?: "inset" | "floating" | "sidebar";
	size?: "default" | "sm" | "lg";
}

export const AppSidebar = React.forwardRef<HTMLDivElement, AppSidebarProps>(
	({ className, variant = "sidebar", size = "default", ...props }, ref) => {
		return (
			<>
				<Sidebar
					ref={ref}
					variant={variant}
					collapsible="icon"
					className={cn(appSidebarVariants({ variant, size }), className)}
					{...props}
				>
					<SidebarHeader>
						<TeamSwitcher />
					</SidebarHeader>
					<SidebarContent>
						<ScrollArea className="">

							<NavMain />
							<ProjectsList />

						</ScrollArea>
					</SidebarContent>
					<SidebarFooter className="p-2">
						<NavSecondary />


						{/*
						<div className="overflow-hidden group-data-[collapsible=icon]:hidden flex flex-col gap-2">
							<SidebarOptInForm />
							<CardUpgrade />
						</div> */}
						<NavUser />
					</SidebarFooter>
					<SidebarRail />
				</Sidebar>
			</>
		);
	},
);
AppSidebar.displayName = "AppSidebar";
