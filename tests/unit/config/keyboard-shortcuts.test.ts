import { describe, expect, it } from "vitest";
import {
	formatShortcut,
	getShortcutDisplay,
	ON_DEMAND_ACTIONS,
	ShortcutAction,
	shortcutConfig,
	shortcutLabel,
} from "@/config/keyboard-shortcuts";

/**
 * Every shortcut a person reads has to come from `shortcutConfig`.
 *
 * The user menu used to print its hints as hand-written text, and not one of
 * the eight named a key anything was listening for: ⌘A for mod+shift+A, ⌘S
 * for what is now mod+shift+S, ⌘B for mod+shift+Y, ⇧⌘Q for mod+shift+X, and
 * ⌘D and ⌘K for actions that never existed.
 */

describe("formatShortcut", () => {
	it("prints Mac modifiers in the platform's order", () => {
		expect(formatShortcut("mod+shift+S", true)).toBe("⇧⌘S");
		expect(formatShortcut("mod+K", true)).toBe("⌘K");
		expect(formatShortcut("ctrl+alt+shift+mod+P", true)).toBe("⌃⌥⇧⌘P");
	});

	it("spells modifiers out elsewhere, with mod meaning Ctrl", () => {
		expect(formatShortcut("mod+shift+S", false)).toBe("Ctrl+Shift+S");
		expect(formatShortcut("mod+K", false)).toBe("Ctrl+K");
	});

	it("capitalizes a named key and leaves a single character alone", () => {
		expect(formatShortcut("Escape", true)).toBe("Escape");
		expect(formatShortcut("mod+enter", true)).toBe("⌘Enter");
		expect(formatShortcut("/", true)).toBe("/");
	});
});

describe("shortcutLabel", () => {
	it("resolves the keys the user menu shows", () => {
		expect(shortcutLabel(ShortcutAction.GOTO_ADMIN, true)).toBe("⇧⌘A");
		expect(shortcutLabel(ShortcutAction.GOTO_SETTINGS, true)).toBe("⇧⌘S");
		expect(shortcutLabel(ShortcutAction.SET_THEME_LIGHT, true)).toBe("⇧⌘L");
		expect(shortcutLabel(ShortcutAction.SET_THEME_DARK, true)).toBe("⇧⌘D");
		expect(shortcutLabel(ShortcutAction.SET_THEME_SYSTEM, true)).toBe("⇧⌘Y");
		expect(shortcutLabel(ShortcutAction.LOGOUT_USER, true)).toBe("⇧⌘X");
	});

	it("shows the search key the header advertises", () => {
		expect(shortcutLabel(ShortcutAction.OPEN_SEARCH, true)).toBe("⌘K");
		expect(shortcutLabel(ShortcutAction.OPEN_SEARCH, false)).toBe("Ctrl+K");
	});

	it("gives every configured action a label on both platforms", () => {
		for (const [, action] of shortcutConfig) {
			expect(shortcutLabel(action, true)).toBeTruthy();
			expect(shortcutLabel(action, false)).toBeTruthy();
		}
	});
});

describe("shortcutConfig", () => {
	it("binds every action in the map to a key", () => {
		for (const action of Object.values(ShortcutAction)) {
			expect(getShortcutDisplay(action)).not.toBeNull();
		}
	});

	it("binds no key twice", () => {
		const keys = shortcutConfig.map(([hotkey]) => hotkey.toLowerCase());
		expect(new Set(keys).size).toBe(keys.length);
	});

	/**
	 * A bare character key belongs to whatever owns a text field on the page,
	 * not to the app, so "/" for search is the only one allowed. A named key is
	 * a different matter: Escape types nothing, and its binding neither swallows
	 * the press nor claims a handler that is always there.
	 */
	it("gives no single character an unmodified binding but the search slash", () => {
		const bare = shortcutConfig
			.filter(([hotkey]) => !hotkey.includes("+") && hotkey.length === 1)
			.map(([hotkey]) => hotkey);
		expect(bare).toEqual(["/"]);
	});

	/**
	 * Shift plus punctuation is a binding that can never fire.
	 *
	 * Holding shift rewrites `event.key` for a punctuation key: the comma key
	 * reports "<", not ",". Mantine matches on `event.key` (`usePhysicalKeys` is
	 * false and nothing here passes options), so "mod+shift+," waits for a
	 * keystroke no keyboard produces, while `shortcutLabel` still renders a
	 * convincing hint for it. Settings sat on that binding until it moved to
	 * mod+shift+S.
	 *
	 * It even survived a browser test, because pressing the literal character
	 * ("Meta+Shift+,") makes the driver report key "," rather than the "<" a
	 * real press of that physical key produces. A unit test is the honest place
	 * to catch it.
	 *
	 * Letters and digits are safe: shift only changes their case, and
	 * `normalizeKey` folds case before comparing.
	 */
	it("never combines shift with a punctuation key", () => {
		for (const [hotkey] of shortcutConfig) {
			const parts = hotkey.split("+").map((part) => part.trim());
			const key = parts[parts.length - 1] ?? "";
			const hasShift = parts.slice(0, -1).some((part) => part.toLowerCase() === "shift");
			if (!hasShift) continue;
			expect(
				key.length > 1 || /^[a-z0-9]$/i.test(key),
				`"${hotkey}" puts shift on "${key}"; shift rewrites event.key for punctuation, so it can never fire`
			).toBe(true);
		}
	});
});

/**
 * Mantine's `useHotkeys` calls `preventDefault` on every binding unless told
 * otherwise. That is right for a key the app owns outright and wrong for one
 * the browser shares: Escape was bound globally with the default, so every
 * Escape press anywhere was consumed to close a popover that was usually not
 * mounted.
 */
describe("binding options", () => {
	const optionsFor = (hotkey: string) => shortcutConfig.find(([key]) => key === hotkey)?.[2];

	it("does not swallow Escape", () => {
		expect(optionsFor("Escape")?.preventDefault).toBe(false);
	});

	it("exempts the popover from the unhandled-shortcut warning", () => {
		expect(optionsFor("Escape")?.onDemand).toBe(true);
		expect(ON_DEMAND_ACTIONS).toContain(ShortcutAction.CLOSE_POPOVER);
	});

	it("swallows the keys the app owns outright", () => {
		for (const hotkey of ["mod+K", "mod+shift+S", "mod+shift+X"]) {
			expect(optionsFor(hotkey)?.preventDefault ?? true).toBe(true);
		}
	});

	it("keeps every on-demand action bound to a key", () => {
		for (const action of ON_DEMAND_ACTIONS) {
			expect(getShortcutDisplay(action)).not.toBeNull();
		}
	});
});
