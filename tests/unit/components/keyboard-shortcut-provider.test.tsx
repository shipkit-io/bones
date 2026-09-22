import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KeyboardShortcutProvider } from "@/components/providers/keyboard-shortcut-provider";

/**
 * Mantine's `useHotkeys` calls `preventDefault` on every binding unless the
 * third tuple element says otherwise, and the provider used to pass only two.
 * So Escape, bound globally to close a popover that is usually not even
 * mounted, was consumed on every press anywhere in the app. The comment in the
 * provider said "uncomment if needed for specific shortcuts"; Mantine had
 * already done it for all of them.
 *
 * These assert the behaviour rather than the config, because the config is
 * only half the mechanism.
 */

function press(key: string, init: Partial<KeyboardEventInit> = {}): KeyboardEvent {
	const event = new KeyboardEvent("keydown", {
		key,
		bubbles: true,
		cancelable: true,
		...init,
	});
	document.documentElement.dispatchEvent(event);
	return event;
}

describe("KeyboardShortcutProvider", () => {
	it("leaves Escape to whatever is open", () => {
		render(
			<KeyboardShortcutProvider>
				<div />
			</KeyboardShortcutProvider>
		);
		expect(press("Escape").defaultPrevented).toBe(false);
	});

	it("swallows a key the app owns outright", () => {
		render(
			<KeyboardShortcutProvider>
				<div />
			</KeyboardShortcutProvider>
		);
		expect(press("K", { metaKey: true }).defaultPrevented).toBe(true);
	});

	it("ignores a key it does not bind", () => {
		render(
			<KeyboardShortcutProvider>
				<div />
			</KeyboardShortcutProvider>
		);
		expect(press("Q", { metaKey: true }).defaultPrevented).toBe(false);
	});
});
