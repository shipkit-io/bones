"use client";

import { Link } from "@/components/primitives/link-with-transition";
import { LogOut, Settings, Sparkles } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { CaretSortIcon } from "@radix-ui/react-icons";

interface NavUserProps {
	className?: string;
	showUpgrade?: boolean;
}

export function NavUser({ className, showUpgrade = true }: NavUserProps) {
	const { isMobile } = useSidebar();
	const { data: session, status } = useSession();

	const isLoading = status === "loading";
	const isAuthenticated = !!session?.user;

	const userInitials = session?.user?.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();

	return (
		<SidebarMenu className={className}>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className={cn(
								"data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
								isLoading && "opacity-50",
							)}
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									src={session?.user?.image ?? undefined}
									alt={session?.user?.name ?? "User"}
								/>
								<AvatarFallback className="rounded-lg">
									{userInitials ?? "ME"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">
									{session?.user?.name ?? "Guest User"}
								</span>
								<span className="truncate text-xs">
									{session?.user?.email ?? "Not signed in"}
								</span>
							</div>
							<CaretSortIcon className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage
										src={session?.user?.image ?? undefined}
										alt={session?.user?.name ?? "User"}
									/>
									<AvatarFallback className="rounded-lg">
										{userInitials ?? "Me"}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">
										{session?.user?.name ?? "Guest User"}
									</span>
									<span className="truncate text-xs">
										{session?.user?.email ?? "Not signed in"}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{isAuthenticated ? (
							<>
								{showUpgrade && (
									<>
										<DropdownMenuGroup>
											<DropdownMenuItem asChild>
												<Link href={routes.pricing}>
													<Sparkles className="mr-2" />
													Upgrade to Pro
												</Link>
											</DropdownMenuItem>
										</DropdownMenuGroup>
										<DropdownMenuSeparator />
									</>
								)}
								<DropdownMenuGroup>
									<DropdownMenuItem asChild>
										<Link href={routes.app.settings}>
											<Settings className="mr-2" />
											Settings
										</Link>
									</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => signOut()}
									className="text-red-600 focus:bg-red-600/10 dark:text-red-500 dark:focus:bg-red-950"
								>
									<LogOut className="mr-2" />
									Sign out
								</DropdownMenuItem>
							</>
						) : (
							<DropdownMenuItem asChild>
								<Link href={routes.auth.signIn}>
									<LogOut className="mr-2" />
									Sign in
								</Link>
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
