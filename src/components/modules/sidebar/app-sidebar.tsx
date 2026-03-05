import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { useId } from "react";
import { NavUser } from "@/components/blocks/nav-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NavMain } from "../../blocks/nav-main";
import { NavSecondary } from "../../blocks/nav-secondary";

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
		const sidebarId = useId();

		return (
			<Sidebar
				id={sidebarId}
				ref={ref}
				variant={variant}
				collapsible="icon"
				className={cn(appSidebarVariants({ variant, size }), "select-none", className)}
				{...props}
			>
				<SidebarContent>
					<ScrollArea className="[&>div>div]:!block">
						<NavMain />
					</ScrollArea>
				</SidebarContent>
				<SidebarFooter className="p-2">
					<div>
						<NavSecondary />

						{/*
						<div className="overflow-hidden group-data-[collapsible=icon]:hidden flex flex-col gap-2">
							<SidebarOptInForm />
							<CardUpgrade />
							</div> */}
						<NavUser />
					</div>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
		);
	}
);
AppSidebar.displayName = "AppSidebar";
