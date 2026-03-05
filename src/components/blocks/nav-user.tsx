"use client";

import { CaretSortIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { UserMenuDropdown } from "@/components/modules/user/user-menu-dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";

interface NavUserProps {
	className?: string;
	showUpgrade?: boolean;
}

export function NavUser({ className, showUpgrade = true }: NavUserProps) {
	const { isMobile } = useSidebar();
	const { data: session, status } = useSession();
	const [isOpen, setIsOpen] = useState(false);
	const isAdmin = useIsAdmin();
	const { hasActiveSubscription } = useSubscription();
	const isLoading = status === "loading";

	const userInitials = session?.user?.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();

	return (
		<SidebarMenu className={className}>
			<SidebarMenuItem>
				<UserMenuDropdown
					isAdmin={isAdmin}
					isOpen={isOpen}
					setIsOpen={setIsOpen}
					user={session?.user}
					showUpgrade={showUpgrade}
					hasActiveSubscription={hasActiveSubscription}
					showOnboarding={true}
					side={isMobile ? "bottom" : "right"}
					align="end"
					sideOffset={4}
					contentClassName="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
				>
					<SidebarMenuButton
						size="lg"
						className={cn(
							"data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
							isLoading && "opacity-50"
						)}
					>
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarImage
								src={session?.user?.image ?? undefined}
								alt={session?.user?.name ?? "User"}
							/>
							<AvatarFallback className="rounded-lg">{userInitials ?? "ME"}</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">{session?.user?.name ?? "Guest User"}</span>
							<span className="truncate text-xs">{session?.user?.email ?? "Not signed in"}</span>
						</div>
						<CaretSortIcon className="ml-auto size-4" />
					</SidebarMenuButton>
				</UserMenuDropdown>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
