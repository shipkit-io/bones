import type { HotkeyItem } from "@mantine/hooks";

/**
 * Defines unique identifiers for each keyboard shortcut action.
 */
export const ShortcutAction = {
	OPEN_SEARCH: "open-search",
	TOGGLE_SIDEBAR: "toggle-sidebar",
	SUBMIT_AI_PROMPT: "submit-ai-prompt",
	LOGOUT_USER: "logout-user",
	CLOSE_POPOVER: "close-popover",
	SET_THEME_LIGHT: "set-theme-light",
	SET_THEME_DARK: "set-theme-dark",
	SET_THEME_SYSTEM: "set-theme-system",
	GOTO_ADMIN: "goto-admin",
	GOTO_SETTINGS: "goto-settings",
	// Add other actions as needed
} as const;

export type ShortcutActionType = (typeof ShortcutAction)[keyof typeof ShortcutAction];

/**
 * Maps keyboard shortcuts (using Mantine's HotkeyItem format) to actions.
 * @see https://mantine.dev/hooks/use-hotkeys/
 *
 * Remember to update this map when adding new shortcuts or changing keybindings.
 */
export const shortcutConfig: readonly (readonly [string, ShortcutActionType])[] = [
	// Universal search - works with whatever search component is visible
	["mod+K", ShortcutAction.OPEN_SEARCH],
	["/", ShortcutAction.OPEN_SEARCH],

	// App Actions
	["mod+Enter", ShortcutAction.SUBMIT_AI_PROMPT],
	["mod+shift+X", ShortcutAction.LOGOUT_USER],
	["mod+shift+B", ShortcutAction.TOGGLE_SIDEBAR],
	["Escape", ShortcutAction.CLOSE_POPOVER],

	// Theme
	["mod+shift+L", ShortcutAction.SET_THEME_LIGHT],
	["mod+shift+D", ShortcutAction.SET_THEME_DARK],
	["mod+shift+Y", ShortcutAction.SET_THEME_SYSTEM],

	// Navigation
	["mod+shift+A", ShortcutAction.GOTO_ADMIN],
	["mod+shift+,", ShortcutAction.GOTO_SETTINGS],
	// Add other shortcuts here
];

/**
 * Helper function to get the display shortcut for an action
 */
export function getShortcutDisplay(action: ShortcutActionType): string | null {
	const shortcut = shortcutConfig.find(([, act]) => act === action);
	return shortcut ? shortcut[0] : null;
}
