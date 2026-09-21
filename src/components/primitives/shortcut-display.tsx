"use client";

import type * as React from "react";
import { type ShortcutActionType, shortcutLabel } from "@/config/keyboard-shortcuts";
import { useIsMac } from "@/hooks/use-is-mac";
import { cn } from "@/lib/utils";

interface ShortcutDisplayProps {
	action: ShortcutActionType;
	className?: string;
	/** Render as a different component, e.g., DropdownMenuShortcut */
	as?: React.ElementType<{ children?: React.ReactNode; className?: string }>;
	/** Base styles to apply, defaults to kbd styles */
	baseClassName?: string;
}

// Default styles mimicking Shadcn kbd
const defaultKbdStyles =
	"h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium";

/**
 * The key bound to an action, as a person reads it.
 *
 * This is the only way a shortcut should reach the screen. Anything that
 * hand-writes "⌘S" into markup drifts from the binding or outlives it: the
 * user menu did exactly that, and all eight of its hints named a key nothing
 * was listening for.
 *
 * When an action has more than one binding, `shortcutConfig` order decides
 * which is shown, so list the one you want advertised first (mod+K before "/"
 * for search). Formatting itself is pure and lives in the config module.
 */
export const ShortcutDisplay = ({
	action,
	className,
	as: Component = "kbd", // Default to HTML kbd tag
	baseClassName = defaultKbdStyles,
}: ShortcutDisplayProps) => {
	const isMac = useIsMac();
	const label = shortcutLabel(action, isMac);

	// No binding means nothing to advertise. Rendering an empty element here
	// would put a stray box in a menu row.
	if (!label) return null;

	const finalClassName =
		Component === "kbd" ? cn("inline-flex", baseClassName, className) : className;

	return <Component className={finalClassName}>{label}</Component>;
};

ShortcutDisplay.displayName = "ShortcutDisplay";
