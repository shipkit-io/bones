import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  KeyboardShortcutProvider,
  useKeyboardShortcut,
  useKeyboardShortcutContext,
} from "@/components/providers/keyboard-shortcut-provider";
import { ShortcutAction } from "@/config/keyboard-shortcuts";

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

/**
 * `useKeyboardShortcut` has no dependency array, and these are the reason it
 * does not need one.
 *
 * It used to take a fourth `_deps` parameter that nothing read. Callers passed
 * real-looking arrays to it -- `[closePopover, isOpen]`, `[handleShortcut]` --
 * so the signature advertised a staleness contract the body never honoured and
 * never had to: the callback and the gate live in refs refreshed after every
 * render. Dropping the parameter is only safe while that stays true, so the
 * freshness it was pretending to provide is asserted here directly. Wire a
 * deps array into the handler memo and the last of these fails, which is the
 * churn the refs exist to avoid.
 *
 * mod+shift+B is a live binding the app owns outright, so it carries no
 * special-case behaviour of its own.
 */
describe("useKeyboardShortcut without a dependency array", () => {
  function pressToggleSidebar(): void {
    press("B", { metaKey: true, shiftKey: true });
  }

  it("runs the latest callback, not the closure from the render that registered", () => {
    const seen: number[] = [];
    function Handler({ count }: { count: number }) {
      useKeyboardShortcut(ShortcutAction.TOGGLE_SIDEBAR, () => {
        seen.push(count);
      });
      return null;
    }

    const { rerender } = render(
      <KeyboardShortcutProvider>
        <Handler count={1} />
      </KeyboardShortcutProvider>
    );
    rerender(
      <KeyboardShortcutProvider>
        <Handler count={2} />
      </KeyboardShortcutProvider>
    );
    pressToggleSidebar();

    expect(seen).toEqual([2]);
  });

  it("reads the latest isActive, so a gate that just opened lets the press through", () => {
    let fired = 0;
    function Handler({ isOpen }: { isOpen: boolean }) {
      useKeyboardShortcut(
        ShortcutAction.TOGGLE_SIDEBAR,
        () => {
          fired += 1;
        },
        () => isOpen
      );
      return null;
    }

    const { rerender } = render(
      <KeyboardShortcutProvider>
        <Handler isOpen={false} />
      </KeyboardShortcutProvider>
    );
    pressToggleSidebar();
    expect(fired).toBe(0);

    rerender(
      <KeyboardShortcutProvider>
        <Handler isOpen={true} />
      </KeyboardShortcutProvider>
    );
    pressToggleSidebar();
    expect(fired).toBe(1);
  });

  it("registers once, so a new callback identity every render costs no re-registration", () => {
    let fired = 0;
    // Every registration and unregistration replaces the provider's handler
    // map, which rebuilds `triggerAction` and with it the context value. So a
    // growing set of context identities is re-registration, observed from
    // outside the provider.
    const contextValues = new Set<unknown>();

    function Probe() {
      contextValues.add(useKeyboardShortcutContext());
      return null;
    }

    function Handler({ label }: { label: string }) {
      // A fresh arrow function on every render, which is what a caller writing
      // an inline callback actually produces.
      useKeyboardShortcut(ShortcutAction.TOGGLE_SIDEBAR, () => {
        fired += 1;
      });
      return <span>{label}</span>;
    }

    const tree = (label: string) => (
      <KeyboardShortcutProvider>
        <Probe />
        <Handler label={label} />
      </KeyboardShortcutProvider>
    );

    const { rerender } = render(tree("first"));
    const afterFirstRegistration = contextValues.size;

    for (const label of ["second", "third", "fourth", "fifth"]) {
      rerender(tree(label));
    }

    expect(contextValues.size).toBe(afterFirstRegistration);
    pressToggleSidebar();
    expect(fired).toBe(1);
  });
});
