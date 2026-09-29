"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { UserIcon } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "@/lib/auth/use-session";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";
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
import { ShortcutDisplay } from "@/components/primitives/shortcut-display";
import { ShortcutAction } from "@/config/keyboard-shortcuts";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useSignInRedirectUrl } from "@/hooks/use-sign-in-redirect-url";
import { cn } from "@/lib/utils";
import { updateTheme } from "@/server/actions/settings";

type Theme = "light" | "dark" | "system";

interface UserMenuProps {
  size?: "default" | "sm";
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ size = "default", className }) => {
  const { data: session, status } = useSession();
  const signInRedirectUrl = useSignInRedirectUrl();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const isAdmin = session?.user?.isAdmin === true;

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
            toast.error("Failed to save theme preference", {
              description: result.error || "Your theme preference will reset on next visit.",
            });
            return;
          }
          toast.success("Theme updated", {
            description: result.message,
          });
        } catch (error) {
          console.error("Failed to update theme:", error);
          toast.error("Failed to save theme preference", {
            description: "Your theme preference will reset on next visit.",
          });
        }
      }
    },
    [session?.user, setTheme]
  );

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only handle if Command/Control is pressed
      if (!(e.metaKey || e.ctrlKey)) return;

      switch (e.key) {
        case "l":
          e.preventDefault();
          await handleThemeChange("light");
          break;
        case "d":
          if (e.shiftKey) {
            e.preventDefault();
            await handleThemeChange("dark");
          }
          break;
        case "b":
          e.preventDefault();
          await handleThemeChange("system");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleThemeChange]);

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
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "cursor-pointer rounded-full"
        )}
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
            <p className="text-sm leading-none font-medium">{session?.user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href={routes.admin.index}>
                Admin
                <ShortcutDisplay action={ShortcutAction.GOTO_ADMIN} as={DropdownMenuShortcut} />
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={routes.app.dashboard}>Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={routes.settings.index}>
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
                <ShortcutDisplay
                  action={ShortcutAction.SET_THEME_LIGHT}
                  as={DropdownMenuShortcut}
                />
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="flex items-center gap-2">
                <MoonIcon className="size-4" />
                <span>Dark</span>
                <ShortcutDisplay action={ShortcutAction.SET_THEME_DARK} as={DropdownMenuShortcut} />
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" className="flex items-center gap-2">
                <DesktopIcon className="size-4" />
                <span>System</span>
                <ShortcutDisplay
                  action={ShortcutAction.SET_THEME_SYSTEM}
                  as={DropdownMenuShortcut}
                />
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
