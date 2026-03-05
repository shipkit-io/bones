"use client";

import { UserIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import * as React from "react";
import { UserMenuDropdown } from "@/components/modules/user/user-menu-dropdown";
import { Link } from "@/components/primitives/link";
import { useKeyboardShortcut } from "@/components/providers/keyboard-shortcut-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button, buttonVariants } from "@/components/ui/button";
import { useThemeToggle, type Theme } from "@/components/ui/shipkit/theme";
import { ToastAction } from "@/components/ui/toast";
import { ShortcutAction, type ShortcutActionType } from "@/config/keyboard-shortcuts";
import { routes } from "@/config/routes";
import { useSignInRedirectUrl } from "@/hooks/use-auth-redirect";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateTheme } from "@/server/actions/settings";
import type { User } from "@/types/user";

interface UserMenuProps {
	size?: "default" | "sm";
	className?: string;
	showUpgrade?: boolean;
	user?: User | null;
}

export const UserMenu = ({
	size = "default",
	className,
	showUpgrade = false,
	user,
}: UserMenuProps) => {
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const signInRedirectUrl = useSignInRedirectUrl();
	const { toast } = useToast();
	const [isOpen, setIsOpen] = React.useState(false);
	const { hasActiveSubscription } = useSubscription();
	const router = useRouter();
	const isAdmin = useIsAdmin();

	const currentUser = user ?? session?.user;

	/*
	 * Persist theme to the database when the user is logged in.
	 * We do this via `useThemeToggle({ onThemeChange })` so ALL theme changes
	 * (dropdown + keyboard shortcuts + animated transitions) follow one path.
	 */
	const handleThemePersist = React.useCallback(
		async (newTheme: Theme) => {
			if (!currentUser) return;

			try {
				const result = await updateTheme(newTheme);
				if (!result.success) {
					toast({
						title: "Failed to save theme preference",
						description:
							result.error || "Your theme preference could not be saved.",
						variant: "destructive",
					});
				}

				toast({
					title: "Theme updated",
					description: result.message,
				});
			} catch (error) {
				console.error("Failed to save theme preference:", error);
				toast({
					title: "Failed to save theme preference",
					description: "An unexpected error occurred while saving your theme.",
					variant: "destructive",
				});
			}
		},
		[currentUser, toast],
	);

	const { theme, setLightTheme, setDarkTheme, setSystemTheme } = useThemeToggle({
		onThemeChange: handleThemePersist,
	});

	// Detect invalid session state: user object exists but is missing required fields
	// This can happen after deployment or session invalidation
	const isInvalidSession = React.useMemo(() => {
		if (!currentUser) return false;
		// A valid user must have an id - if currentUser exists but has no id, session is invalid
		if (!currentUser.id) return true;
		// If user has no name AND no image, the session data is likely corrupted/stale
		// This causes the "?" avatar fallback which indicates an invalid session
		if (!currentUser.name && !currentUser.image) return true;
		return false;
	}, [currentUser]);

	// Handle invalid session by logging out and showing a toast
	React.useEffect(() => {
		if (isInvalidSession && status !== "loading") {
			// Sign out without redirect to avoid navigation loop
			void signOut({ redirect: false }).then(() => {
				toast({
					title: "Session expired",
					description:
						"Your session has expired. Would you like to sign in again?",
					action: (
						<ToastAction altText="Sign in" asChild>
							<Link href={signInRedirectUrl}>Sign in</Link>
						</ToastAction>
					),
				});
			});
		}
	}, [isInvalidSession, status, toast, signInRedirectUrl]);

	const handleThemeChange = React.useCallback(
		(value: string) => {
			const newTheme = value as Theme;
			switch (newTheme) {
				case "light":
					setLightTheme();
					break;
				case "dark":
					setDarkTheme();
					break;
				case "system":
					setSystemTheme();
					break;
			}
		},
		[setLightTheme, setDarkTheme, setSystemTheme],
	);

	// ---- Refactored Shortcut Handling ----
	const handleShortcut = React.useCallback(
		(event: KeyboardEvent, action: ShortcutActionType) => {
			event.preventDefault();
			switch (action) {
				case ShortcutAction.SET_THEME_LIGHT:
					handleThemeChange("light");
					break;
				case ShortcutAction.SET_THEME_DARK:
					handleThemeChange("dark");
					break;
				case ShortcutAction.SET_THEME_SYSTEM:
					handleThemeChange("system");
					break;
				case ShortcutAction.GOTO_ADMIN:
					if (isAdmin) router.push(routes.admin.index);
					break;
				case ShortcutAction.GOTO_SETTINGS:
					router.push(routes.settings.index);
					break;
				case ShortcutAction.LOGOUT_USER:
					void signOut({ callbackUrl: routes.home });
					break;
			}
		},
		[handleThemeChange, isAdmin, router],
	);

	const isAuthenticated = status === "authenticated";

	useKeyboardShortcut(
		ShortcutAction.SET_THEME_LIGHT,
		(event) => handleShortcut(event, ShortcutAction.SET_THEME_LIGHT),
		undefined,
		[handleShortcut],
	);
	useKeyboardShortcut(
		ShortcutAction.SET_THEME_DARK,
		(event) => handleShortcut(event, ShortcutAction.SET_THEME_DARK),
		undefined,
		[handleShortcut],
	);
	useKeyboardShortcut(
		ShortcutAction.SET_THEME_SYSTEM,
		(event) => handleShortcut(event, ShortcutAction.SET_THEME_SYSTEM),
		undefined,
		[handleShortcut],
	);
	useKeyboardShortcut(
		ShortcutAction.GOTO_ADMIN,
		(event) => handleShortcut(event, ShortcutAction.GOTO_ADMIN),
		() => isAuthenticated && isAdmin,
		[handleShortcut, isAuthenticated, isAdmin],
	);
	useKeyboardShortcut(
		ShortcutAction.GOTO_SETTINGS,
		(event) => handleShortcut(event, ShortcutAction.GOTO_SETTINGS),
		() => isAuthenticated,
		[handleShortcut, isAuthenticated],
	);
	useKeyboardShortcut(
		ShortcutAction.LOGOUT_USER,
		(event) => handleShortcut(event, ShortcutAction.LOGOUT_USER),
		() => isAuthenticated,
		[handleShortcut, isAuthenticated],
	);

	return (
		<div
			className={cn(
				"relative rounded-full flex items-center justify-center aspect-square",
				size === "sm" ? "size-9" : "size-9",
			)}
		>
			{/* Loading state */}
			{status === "loading" && (
				<BorderBeam size={size === "sm" ? 20 : 25} duration={1.5} delay={9} />
			)}

			{/* Not authenticated */}
			{currentUser ? (
				<UserMenuDropdown
					isOpen={isOpen}
					setIsOpen={setIsOpen}
					user={currentUser}
					isAdmin={isAdmin}
					showUpgrade={showUpgrade}
					hasActiveSubscription={hasActiveSubscription}
					theme={theme}
					handleThemeChange={handleThemeChange}
				>
					<Button
						variant="ghost"
						size="icon"
						className={cn(
							"relative rounded-full",
							size === "sm" ? "size-6" : "size-8",
							className,
						)}
						aria-label="User menu"
					>
						<Avatar className={cn(size === "sm" ? "size-6" : "size-8")}>
							<AvatarImage
								src={currentUser?.image || ""}
								alt={currentUser?.name || "User avatar"}
								draggable={false}
							/>
							<AvatarFallback>
								{currentUser?.name?.[0]?.toUpperCase() || "?"}
							</AvatarFallback>
						</Avatar>
					</Button>
				</UserMenuDropdown>
			) : (
				<>
					{pathname !== routes.auth.signIn &&
						pathname !== routes.auth.signUp ? (
						<Link
							href={signInRedirectUrl}
							className={cn(
								buttonVariants({ variant: "ghost", size: "icon" }),
								"rounded-full cursor-pointer",
							)}
						>
							<UserIcon className="size-6" />
						</Link>
					) : (
						<Button
							variant="ghost"
							size="icon"
							className={cn("relative rounded-full", className)}
						>
							<UserIcon className="size-6" />
						</Button>
					)}
				</>
			)}
		</div>
	);
};

