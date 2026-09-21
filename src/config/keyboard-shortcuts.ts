/**
 * Every global keyboard shortcut, and nothing else.
 *
 * This list is a promise. `KeyboardShortcutProvider` binds each entry through
 * Mantine's `useHotkeys` and fans the press out to whatever registered
 * `useKeyboardShortcut` for that action, so an entry with no handler binds the
 * key, swallows the press (Mantine calls `preventDefault` for every match) and
 * does nothing, silently, with no build, lint or test failure anywhere. An
 * action belongs here only once something handles it; in development the
 * provider warns about the ones nothing claimed.
 *
 * That matters most downstream. Removing a component is the normal thing to do
 * to a boilerplate, and removing the component that handled a shortcut leaves
 * the key bound and the config still advertising it.
 *
 * Anything that shows a shortcut to a person, a menu row, a tooltip, a `<kbd>`,
 * must read it from here through `shortcutLabel`, never as a hand-written
 * string. The user menu printed eight hints as text and not one of them named a
 * key this config bound: ⌘A for what is bound to mod+shift+A, ⌘S for
 * mod+shift+S, ⇧⌘Q for mod+shift+X, and ⌘D and ⌘K for actions that do not exist.
 */
export const ShortcutAction = {
  OPEN_SEARCH: "open-search",
  LOGOUT_USER: "logout-user",
  SET_THEME_LIGHT: "set-theme-light",
  SET_THEME_DARK: "set-theme-dark",
  SET_THEME_SYSTEM: "set-theme-system",
  GOTO_ADMIN: "goto-admin",
  GOTO_SETTINGS: "goto-settings",
} as const;

export type ShortcutActionType = (typeof ShortcutAction)[keyof typeof ShortcutAction];

/**
 * Maps keyboard shortcuts (using Mantine's HotkeyItem format) to actions.
 * @see https://mantine.dev/hooks/use-hotkeys/
 *
 * Mantine ignores hotkeys raised from an INPUT, TEXTAREA, SELECT or a
 * contenteditable element, so none of these fire while someone is typing. That
 * is the right behaviour and is worth knowing before you file "mod+K does
 * nothing" as a bug.
 *
 * When an action has more than one binding the first one listed is the one the
 * UI advertises, so put the one you want shown first.
 */
export const shortcutConfig: readonly (readonly [string, ShortcutActionType])[] = [
  // Universal search - handled by the header search dialog.
  ["mod+K", ShortcutAction.OPEN_SEARCH],
  ["/", ShortcutAction.OPEN_SEARCH],

  // App Actions
  ["mod+shift+X", ShortcutAction.LOGOUT_USER],

  // Theme
  ["mod+shift+L", ShortcutAction.SET_THEME_LIGHT],
  ["mod+shift+D", ShortcutAction.SET_THEME_DARK],
  ["mod+shift+Y", ShortcutAction.SET_THEME_SYSTEM],

  // Navigation.
  // Settings is not on comma, the usual Mac spot, because shift+comma reports
  // event.key "<" and Mantine matches on event.key: "mod+shift+," can never
  // fire. Plain "mod+," is Chrome's own settings shortcut.
  ["mod+shift+A", ShortcutAction.GOTO_ADMIN],
  ["mod+shift+S", ShortcutAction.GOTO_SETTINGS],
];

/** The raw hotkey bound to an action, or null when the action has no key. */
export function getShortcutDisplay(action: ShortcutActionType): string | null {
  const shortcut = shortcutConfig.find(([, act]) => act === action);
  return shortcut ? shortcut[0] : null;
}

/**
 * A hotkey as a person reads it: "mod+shift+K" becomes a glyph run on a Mac and
 * "Ctrl+Shift+K" everywhere else.
 *
 * Mac order is the platform's, modifiers ascending: control, option, shift,
 * command.
 */
export function formatShortcut(hotkey: string, isMac: boolean): string {
  const parts = hotkey.split("+").map((part) => part.trim().toLowerCase());
  const key = parts[parts.length - 1] ?? "";
  const has = (name: string) => parts.slice(0, -1).includes(name);
  const printedKey = key.length === 1 ? key.toUpperCase() : capitalize(key);

  if (isMac) {
    return (
      (has("ctrl") ? "⌃" : "") +
      (has("alt") ? "⌥" : "") +
      (has("shift") ? "⇧" : "") +
      (has("mod") || has("meta") ? "⌘" : "") +
      printedKey
    );
  }

  const names = [
    has("mod") || has("ctrl") ? "Ctrl" : null,
    has("alt") ? "Alt" : null,
    has("shift") ? "Shift" : null,
    has("meta") ? "Win" : null,
  ].filter((name): name is string => name !== null);
  return [...names, printedKey].join("+");
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]?.toUpperCase() + value.slice(1);
}

/**
 * The display form of an action's key, or null when it has no key.
 *
 * This is the only way a shortcut should reach a person's eyes. A row that
 * prints its own key drifts from the binding, or outlives it entirely.
 */
export function shortcutLabel(action: ShortcutActionType, isMac: boolean): string | null {
  const hotkey = getShortcutDisplay(action);
  return hotkey === null ? null : formatShortcut(hotkey, isMac);
}
