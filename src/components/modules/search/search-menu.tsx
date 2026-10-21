"use client";

import type { DialogProps } from "@radix-ui/react-dialog";
import {
  FileIcon,
  LaptopIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";
import { docsConfig } from "@/components/modules/search/example";
import { ShortcutSlot } from "@/components/primitives/shortcut-display";
import { useKeyboardShortcut } from "@/components/providers/keyboard-shortcut-provider";
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
import { DialogTitle } from "@/components/ui/dialog";
import { ShortcutAction } from "@/config/keyboard-shortcuts";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

export interface SearchMenuProps extends DialogProps {
  /**
   * The title to display in the search menu dialog
   * @default "Search Documentation"
   */
  title?: string;

  /**
   * Button variant for the trigger
   * @default "outline"
   */
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

  /**
   * Custom button text
   * @default "Search..."
   */
  buttonText?: string | React.ReactNode;

  /**
   * Whether to show the keyboard shortcut
   * @default true
   */
  showShortcut?: boolean;

  /**
   * Custom button className
   */
  buttonClassName?: string;

  /**
   * Whether this is a minimal search (fewer options)
   * @default false
   */
  minimal?: boolean;

  /**
   * When true, the button can collapse to show only an icon when space is tight
   * @default false
   */
  collapsible?: boolean;
}

/**
 * Search menu component for searching documentation and accessing common actions
 * Can be configured for different use cases with props
 */
export function SearchMenu({
  title = `Search ${siteConfig.title}`,
  buttonVariant = "outline",
  buttonText = "Search...",
  showShortcut = true,
  buttonClassName,
  minimal = false,
  collapsible = false,
  ...props
}: SearchMenuProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { setTheme } = useTheme();

  useKeyboardShortcut(
    ShortcutAction.OPEN_SEARCH,
    (event) => {
      const target = event.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      setOpen((prevOpen) => !prevOpen);
    },
    undefined,
    []
  );

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant={buttonVariant}
        className={cn(
          "bg-muted/50 text-sm font-normal text-muted-foreground shadow-none",
          collapsible ? "justify-center lg:justify-start" : "justify-start",
          buttonClassName
        )}
        size="sm"
        onClick={() => setOpen(true)}
        {...props}
      >
        {collapsible && <MagnifyingGlassIcon className="h-4 w-4 shrink-0 lg:mr-2" />}
        <span
          /* `block`, not `inline-flex`: `truncate` only draws its ellipsis on a
             block container, and a flex one cuts the word off mid-letter. */
          className={cn("truncate text-xs", collapsible ? "hidden lg:block" : "block")}
        >
          {buttonText}
        </span>
        {/* The hint sits in flow, in a slot that reserves its own width, rather
            than pinned over the label with `pr-12` reserving room for it.  That
            reservation was dead: Button's own `has-[>svg]:px-2.5` matches the
            magnifier icon and `:has()` carries its argument's specificity, so it
            outranked a `lg:` padding utility and computed padding-right stayed
            10px.  The hint landed 23px inside the placeholder and ate the tail
            of it (LAC-5000).  A sibling needs no reservation to out-specify, and
            `ShortcutSlot` keeps the button one width from the first frame on
            whatever platform is reading it. */}
        {showShortcut && (
          <ShortcutSlot
            action={ShortcutAction.OPEN_SEARCH}
            className={cn(
              "ml-auto text-xs",
              collapsible ? "hidden xl:inline-flex" : "hidden lg:inline-flex"
            )}
          />
        )}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
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
                    runCommand(() => router.push(navItem.href!));
                  }}
                >
                  <FileIcon className="mr-2 h-4 w-4" />
                  {navItem.title}
                </CommandItem>
              ))}
          </CommandGroup>
          {!minimal && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Theme">
                <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                  <SunIcon className="mr-2 h-4 w-4" />
                  Light
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                  <MoonIcon className="mr-2 h-4 w-4" />
                  Dark
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                  <LaptopIcon className="mr-2 h-4 w-4" />
                  System
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
