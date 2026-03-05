import {
	DesktopIcon,
	ExitIcon,
	GearIcon,
	LockClosedIcon,
	MoonIcon,
	PersonIcon,
	RocketIcon,
	SunIcon,
} from "@radix-ui/react-icons";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type * as React from "react";
import { RestartOnboardingButton } from "@/components/modules/onboarding/onboarding-check";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
export interface MenuItemProps {
	href?: string;
	onClick?: () => void;
	label: string;
	icon?: React.ReactNode;
	shortcut?: string;
	className?: string;
}

interface UserMenuDropdownProps {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	user?: User;
	isAdmin?: boolean;
	showUpgrade?: boolean;
	hasActiveSubscription?: boolean;
	showOnboarding?: boolean;
	theme?: string;
	handleThemeChange?: (value: string) => void;
	children: React.ReactNode;
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
	sideOffset?: number;
	className?: string;
	contentClassName?: string;
	additionalMenuItems?: MenuItemProps[];
}

export function UserMenuDropdown({
	isOpen,
	setIsOpen,
	user,
	isAdmin = false,
	showUpgrade = false,
	hasActiveSubscription = false,
	showOnboarding = false,
	theme,
	handleThemeChange,
	children,
	align = "end",
	side,
	sideOffset = 4,
	className,
	contentClassName,
	additionalMenuItems = [],
}: UserMenuDropdownProps) {
	const handleSignOut = () => {
		setIsOpen(false);
		signOut();
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild className={className}>
				{children}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className={cn("w-56", contentClassName)}
				align={align}
				side={side}
				sideOffset={sideOffset}
				forceMount
				onCloseAutoFocus={(event) => {
					event.preventDefault();
				}}
			>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{user?.name ?? "Guest User"}</p>
						<p className="text-xs leading-none text-muted-foreground">
							{user?.email || "Not signed in"}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				{showUpgrade && !hasActiveSubscription && (
					<>
						<DropdownMenuGroup>
							<DropdownMenuItem asChild>
								<Link href={routes.pricing}>
									<Sparkles className="mr-2 size-4" />
									Upgrade to Pro
								</Link>
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
					</>
				)}

				<DropdownMenuGroup>
					{isAdmin && (
						<DropdownMenuItem asChild>
							<Link href={routes.admin.index}>
								<PersonIcon className="mr-2 size-4" />
								Admin
								<DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
							</Link>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem asChild>
						<Link href={routes.app.dashboard}>
							<RocketIcon className="mr-2 size-4" />
							Dashboard
							<DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href={routes.settings.index}>
							<GearIcon className="mr-2 size-4" />
							Settings
							<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
						</Link>
					</DropdownMenuItem>
					{showOnboarding && (
						<DropdownMenuItem asChild>
							<RestartOnboardingButton
								user={user}
								className="w-full justify-start"
								forceVisible={isAdmin}
							/>
						</DropdownMenuItem>
					)}

					{additionalMenuItems.map((item) => (
						<DropdownMenuItem
							key={`menu-item-${item.label}`}
							asChild={!!item.href}
							onClick={item.onClick}
							className={item.className}
						>
							{item.href ? (
								<Link href={item.href}>
									{item.icon && <span className="mr-2">{item.icon}</span>}
									{item.label}
									{item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
								</Link>
							) : (
								<>
									{item.icon && <span className="mr-2">{item.icon}</span>}
									{item.label}
									{item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
								</>
							)}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>

				{handleThemeChange && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<SunIcon className="mr-2 size-4" />
								<span>Theme</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent>
								<DropdownMenuRadioGroup value={theme || "system"} onValueChange={handleThemeChange}>
									<DropdownMenuRadioItem value="light" className="flex items-center gap-2">
										<SunIcon className="size-4" />
										<span>Light</span>
										<DropdownMenuShortcut>⌘L</DropdownMenuShortcut>
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="dark" className="flex items-center gap-2">
										<MoonIcon className="size-4" />
										<span>Dark</span>
										<DropdownMenuShortcut>⇧⌘D</DropdownMenuShortcut>
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="system" className="flex items-center gap-2">
										<DesktopIcon className="size-4" />
										<span>System</span>
										<DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
									</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</>
				)}

				<DropdownMenuSeparator />
				<DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={handleSignOut}>
					<ExitIcon className="mr-2 size-4" />
					Sign out
					<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
