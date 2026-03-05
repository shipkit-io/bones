"use client";

import * as React from "react";
import { type ShortcutActionType, shortcutConfig } from "@/config/keyboard-shortcuts";
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
 * Finds the primary shortcut string for a given action.
 * Ignores alternatives like '/' for OPEN_SEARCH.
 */
function findPrimaryShortcut(action: ShortcutActionType): string | null {
	for (const [shortcut, act] of shortcutConfig) {
		if (act === action) {
			// Basic heuristic: prefer shortcuts with modifiers
			if (
				shortcut.includes("mod+") ||
				shortcut.includes("shift+") ||
				shortcut.includes("alt+") ||
				shortcut.includes("ctrl+")
			) {
				return shortcut;
			}
			// If no modified shortcut found yet, keep track of the first simple one
			if (!shortcut.includes("+ ")) return shortcut; // Return simple keys like 'Escape' or '/'
		}
	}
	// Fallback to the first match if no modified shortcut found
	const firstMatch = shortcutConfig.find(([, act]) => act === action);
	return firstMatch ? firstMatch[0] : null;
}

/**
 * Parses a shortcut string (e.g., "mod+shift+K") into display parts.
 */
function parseShortcut(shortcut: string, isMac: boolean): string[] {
	return shortcut.split("+").map((part) => {
		switch (part.toLowerCase()) {
			case "mod":
				return isMac ? "⌘" : "Ctrl";
			case "shift":
				return isMac ? "⇧" : "Shift";
			case "alt":
				return isMac ? "⌥" : "Alt";
			case "ctrl":
				return "Ctrl";
			case "enter":
				return "Enter"; // Or maybe an icon?
			case "escape":
				return "Esc";
			default:
				return part.toUpperCase(); // Return the key itself, capitalized
		}
	});
}

export const ShortcutDisplay = ({
	action,
	className,
	as: Component = "kbd", // Default to HTML kbd tag
	baseClassName = defaultKbdStyles,
}: ShortcutDisplayProps) => {
	const isMac = useIsMac();
	const primaryShortcut = findPrimaryShortcut(action);

	if (!primaryShortcut) {
		console.warn(`ShortcutDisplay: No shortcut found for action: ${action}`);
		return null; // Don't render if no shortcut is defined
	}

	const parts = parseShortcut(primaryShortcut, isMac);

	// For single keys like '/', just render the key without special styling
	if (parts.length === 1 && primaryShortcut.length === 1) {
		// Use baseClassName only if Component is kbd, otherwise just className
		const finalClassName = Component === "kbd" ? cn(baseClassName, className) : className;
		return <Component className={finalClassName}>{parts[0]}</Component>;
	}

	// Render modifiers and key separately
	// Apply base styles only if Component is kbd
	const finalClassName =
		Component === "kbd"
			? cn("inline-flex", baseClassName, className) // Combine base styles with specific className
			: cn("inline-flex items-center gap-1", className); // Use simpler base for non-kbd elements

	return (
		<Component className={finalClassName}>
			{parts.map((part, index) => (
				<React.Fragment key={index}>{part}</React.Fragment>
			))}
		</Component>
	);
};

ShortcutDisplay.displayName = "ShortcutDisplay";
