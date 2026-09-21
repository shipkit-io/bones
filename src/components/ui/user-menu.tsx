"use client";

import { ShortcutDisplay } from "@/components/primitives/shortcut-display";
import { useKeyboardShortcut } from "@/components/providers/keyboard-shortcut-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ShortcutAction } from "@/config/keyboard-shortcuts";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { useSignInRedirectUrl } from "@/hooks/use-sign-in-redirect-url";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateTheme } from "@/server/actions/settings";
import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { UserIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type Theme = "light" | "dark" | "system";

interface UserMenuProps {
	size?: "default" | "sm";
	className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ size = "default", className }) => {
	const { data: session, status } = useSession();
	const signInRedirectUrl = useSignInRedirectUrl();
	const router = useRouter();
	const { theme, setTheme } = useTheme();
	const { toast } = useToast();
	const [isOpen, setIsOpen] = React.useState(false);

	const isAdmin = Boolean(session?.user?.email && siteConfig.admin.isAdmin(session.user.email));
	const isAuthenticated = Boolean(session?.user);

	const handleThemeChange = React.useCallback(
		async (value: string) => {
			const newTheme = value as Theme;
			// Update the theme immediately for a snappy UI
			setTheme(newTheme);

			// Then persist to the database
			if (session?.user) {
				try {
					const result = await updateTheme(newTheme);
					if (!result.success) {
						toast({
							title: "Failed to save theme preference",
							description: result.error || "Your theme preference will reset on next visit.",
							variant: "destructive",
						});
						return;
					}
					toast({
						title: "Theme updated",
						description: result.message,
					});
				} catch (error) {
					console.error("Failed to update theme:", error);
					toast({
						title: "Failed to save theme preference",
						description: "Your theme preference will reset on next visit.",
						variant: "destructive",
					});
				}
			}
		},
		[session?.user, setTheme, toast]
	);

	/*
	 * The keys this menu advertises, wired to the same code the rows run.
	 *
	 * Every hint comes from `shortcutConfig` via `ShortcutDisplay`, and every
	 * entry it binds is handled here or by the header search, so nothing in the
	 * config is left bound to nothing. This used to be a hand-rolled window
	 * listener that watched for plain Cmd+L, Cmd+D and Cmd+B: it fired while you
	 * were typing in a text field, and it took Cmd+L (the address bar) and Cmd+D
	 * (bookmark) away from the browser.
	 */
	useKeyboardShortcut(ShortcutAction.SET_THEME_LIGHT, () => {
		void handleThemeChange("light");
	});
	useKeyboardShortcut(ShortcutAction.SET_THEME_DARK, () => {
		void handleThemeChange("dark");
	});
	useKeyboardShortcut(ShortcutAction.SET_THEME_SYSTEM, () => {
		void handleThemeChange("system");
	});
	useKeyboardShortcut(
		ShortcutAction.GOTO_ADMIN,
		() => {
			router.push(routes.admin.root);
		},
		() => isAdmin
	);
	useKeyboardShortcut(
		ShortcutAction.GOTO_SETTINGS,
		() => {
			router.push(routes.app.settings);
		},
		() => isAuthenticated
	);
	useKeyboardShortcut(
		ShortcutAction.LOGOUT_USER,
		() => {
			void signOut();
		},
		() => isAuthenticated
	);

	// Loading state
	if (status === "loading") {
		return (
			<Skeleton className={cn("rounded-full", size === "sm" ? "h-6 w-6" : "h-8 w-8")}>
				<div className={cn("rounded-full bg-muted", size === "sm" ? "h-6 w-6" : "h-8 w-8")} />
			</Skeleton>
		);
	}

	// Not authenticated
	if (!session?.user) {
		return (
			<Link
				href={signInRedirectUrl}
				className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full cursor-pointer")}
			>
				<UserIcon className="size-4" />
			</Link>
		);
	}

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn("relative rounded-full", size === "sm" ? "h-6 w-6" : "h-8 w-8", className)}
					aria-label="User menu"
				>
					<Avatar className={cn(size === "sm" ? "h-6 w-6" : "h-8 w-8")}>
						<AvatarImage
							src={session?.user?.image || ""}
							alt={session?.user?.name || "User avatar"}
						/>
						<AvatarFallback>{session?.user?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-56"
				align="end"
				forceMount
				onCloseAutoFocus={(event) => {
					event.preventDefault();
				}}
			>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{session?.user?.name}</p>
						<p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					{isAdmin && (
						<DropdownMenuItem asChild>
							<Link href={routes.admin.root}>
								Admin
								<ShortcutDisplay action={ShortcutAction.GOTO_ADMIN} as={DropdownMenuShortcut} />
							</Link>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem asChild>
						<Link href={routes.app.dashboard}>Dashboard</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href={routes.app.settings}>
							Settings
							<ShortcutDisplay action={ShortcutAction.GOTO_SETTINGS} as={DropdownMenuShortcut} />
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href={routes.app.apiKeys}>API Keys</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
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
								<ShortcutDisplay action={ShortcutAction.SET_THEME_LIGHT} as={DropdownMenuShortcut} />
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="dark" className="flex items-center gap-2">
								<MoonIcon className="size-4" />
								<span>Dark</span>
								<ShortcutDisplay action={ShortcutAction.SET_THEME_DARK} as={DropdownMenuShortcut} />
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="system" className="flex items-center gap-2">
								<DesktopIcon className="size-4" />
								<span>System</span>
								<ShortcutDisplay action={ShortcutAction.SET_THEME_SYSTEM} as={DropdownMenuShortcut} />
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-red-600 dark:text-red-400"
					onClick={() => {
						setIsOpen(false);
						signOut();
					}}
				>
					Sign out
					<ShortcutDisplay action={ShortcutAction.LOGOUT_USER} as={DropdownMenuShortcut} />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
