"use client";

import {
	LifeBuoy,
	type LucideIcon,
	PanelLeftClose,
	PanelLeftOpen,
	Send,
	Settings2,
} from "lucide-react";
import type React from "react";
import { FeedbackDialog } from "@/components/forms/feedback-dialog";
import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

const data = [
	{
		title: "Feedback",
		Icon: Send,
		href: "#feedback",
		component: FeedbackDialog,
	},
	{
		title: "Documentation",
		Icon: LifeBuoy,
		href: routes.docs,
	},
	{
		title: "Settings",
		Icon: Settings2,
		href: routes.settings.index,
	},
];

interface NavSecondaryItem {
	title: string;
	href: string;
	Icon: LucideIcon;
	component?: React.ComponentType<{ trigger?: React.ReactNode }>;
}

interface NavSecondaryProps {
	items?: NavSecondaryItem[];
	className?: string;
}

// Extract common button and tooltip wrapper into a component
interface NavItemWrapperProps {
	title: string;
	open: boolean;
	children: React.ReactNode;
}

const NavItemWrapper = ({ title, open, children }: NavItemWrapperProps) => {
	if (open) {
		return children;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side="right" sideOffset={20}>
				{title}
			</TooltipContent>
		</Tooltip>
	);
};

// Extract common button props
const getButtonProps = (open: boolean) => ({
	variant: "ghost" as const,
	size: "sm" as const,
	className: cn("group justify-center", open && "w-full justify-start"),
});

export function NavSecondary({ items, className }: NavSecondaryProps) {
	const { open, state, toggleSidebar } = useSidebar();
	if (!items) items = data;

	return (
		<nav className={cn("flex flex-col gap-1", className)}>
			{items.map((item) => {
				const Icon = item.Icon;
				const buttonProps = getButtonProps(open);

				// If there's a custom component (like FeedbackDialog), use it
				if (item.component) {
					const Component = item.component;
					return (
						<Component
							key={item.title}
							trigger={
								<NavItemWrapper title={item.title} open={open}>
									<Button
										{...buttonProps}
										className="w-full justify-start group-data-[collapsible=icon]:px-2"
									>
										<Icon className="h-4 w-4 shrink-0" />
										{open && (
											<span className="ml-2 transition-all duration-200 group-data-[collapsible=icon]:opacity-0">
												{item.title}
											</span>
										)}
									</Button>
								</NavItemWrapper>
							}
						/>
					);
				}

				// Regular link — use Link with buttonVariants styling directly
				// to avoid Slot composition issues with next-view-transitions
				return (
					<NavItemWrapper key={item.title} title={item.title} open={open}>
						<Link
							href={item?.href ?? "#"}
							className={cn(
								buttonVariants({ variant: "ghost", size: "sm" }),
								"group justify-center",
								open && "w-full justify-start"
							)}
						>
							<Icon className="h-4 w-4 shrink-0" />
							{open && (
								<span className="ml-2 transition-all duration-200 group-data-[collapsible=icon]:opacity-0">
									{item.title}
								</span>
							)}
						</Link>
					</NavItemWrapper>
				);
			})}

			<NavItemWrapper
				title={state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}
				open={open}
			>
				<Button
					{...getButtonProps(open)}
					type="button"
					onClick={toggleSidebar}
					aria-label={state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}
				>
					{state === "collapsed" ? (
						<PanelLeftOpen className="h-4 w-4 shrink-0" />
					) : (
						<PanelLeftClose className="h-4 w-4 shrink-0" />
					)}
					{open && (
						<span className="ml-2 transition-all duration-200 group-data-[collapsible=icon]:opacity-0">
							{state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}
						</span>
					)}
				</Button>
			</NavItemWrapper>
		</nav>
	);
}
