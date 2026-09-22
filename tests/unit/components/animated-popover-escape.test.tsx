import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KeyboardShortcutProvider } from "@/components/providers/keyboard-shortcut-provider";
import {
	PopoverContent,
	PopoverRoot,
	PopoverTextarea,
	PopoverTrigger,
} from "@/components/ui/cults/animated-popover";

/**
 * Escape has to close this popover from inside its own text field.
 *
 * The global binding cannot do that on its own: Mantine ignores keys raised
 * from an INPUT, TEXTAREA or SELECT, which is right for mod+K and wrong here,
 * because typing is the first thing anyone does with this popover. So the
 * panel also listens for a bubbled Escape, and these cases are why both
 * exist.
 *
 * They assert `defaultPrevented` rather than the panel disappearing, because
 * `AnimatePresence` never completes its exit under jsdom: the panel stays
 * mounted even when the popover's own close button is clicked, so its
 * presence says nothing either way. Consuming the key is the observable
 * signal that a handler ran.
 */

function press(target: Element | Document, key: string): boolean {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
	target.dispatchEvent(event);
	return event.defaultPrevented;
}

function renderPopover() {
	render(
		<KeyboardShortcutProvider>
			<PopoverRoot>
				<PopoverTrigger>Note</PopoverTrigger>
				<PopoverContent>
					<PopoverTextarea />
				</PopoverContent>
			</PopoverRoot>
		</KeyboardShortcutProvider>
	);
}

function open() {
	renderPopover();
	fireEvent.click(screen.getByText("Note"));
	return screen.getByRole("textbox");
}

describe("popover Escape", () => {
	it("is consumed when pressed inside the text field", () => {
		const textarea = open();
		expect(press(textarea, "Escape")).toBe(true);
	});

	it("is consumed when pressed with focus elsewhere", () => {
		open();
		expect(press(document.documentElement, "Escape")).toBe(true);
	});

	it("is left alone while the popover is closed", () => {
		renderPopover();
		expect(press(document.documentElement, "Escape")).toBe(false);
	});

	it("leaves other keys in the field alone", () => {
		const textarea = open();
		expect(press(textarea, "a")).toBe(false);
	});
});
