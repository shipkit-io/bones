import { describe, expect, it } from "vitest";
import {
	formatShortcut,
	getShortcutDisplay,
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

	it("keeps every unmodified key out of the global map but the search slash", () => {
		const unmodified = shortcutConfig
			.filter(([hotkey]) => !hotkey.includes("+"))
			.map(([hotkey]) => hotkey);
		expect(unmodified).toEqual(["/"]);
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
