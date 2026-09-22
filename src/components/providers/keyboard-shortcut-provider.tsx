"use client";

import type { HotkeyItem } from "@mantine/hooks";
import { useHotkeys } from "@mantine/hooks";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type ShortcutActionType, shortcutConfig } from "@/config/keyboard-shortcuts";

interface ShortcutHandler {
  action: ShortcutActionType;
  callback: (event: KeyboardEvent) => void;
  isActive?: () => boolean; // Optional condition to check if the shortcut should be active
}

interface KeyboardShortcutContextProps {
  registerShortcut: (handler: ShortcutHandler) => () => void; // Returns an unregister function
  triggerAction: (action: ShortcutActionType, event?: KeyboardEvent) => void;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextProps | null>(null);

interface KeyboardShortcutProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutProvider({
  children,
}: KeyboardShortcutProviderProps): React.JSX.Element {
  const [handlers, setHandlers] = useState<Map<ShortcutActionType, Set<ShortcutHandler>>>(
    new Map()
  );

  const registerShortcut = useCallback((handler: ShortcutHandler) => {
    setHandlers((prevHandlers) => {
      const newHandlers = new Map(prevHandlers);
      const currentSet = newHandlers.get(handler.action) ?? new Set();
      currentSet.add(handler);
      newHandlers.set(handler.action, currentSet);
      return newHandlers;
    });

    // Return unregister function
    return () => {
      setHandlers((prevHandlers) => {
        const newHandlers = new Map(prevHandlers);
        const currentSet = newHandlers.get(handler.action);
        if (currentSet) {
          currentSet.delete(handler);
          if (currentSet.size === 0) {
            newHandlers.delete(handler.action);
          } else {
            newHandlers.set(handler.action, currentSet);
          }
        }
        return newHandlers;
      });
    };
  }, []);

  const triggerAction = useCallback(
    (action: ShortcutActionType, event?: KeyboardEvent) => {
      const actionHandlers = handlers.get(action);
      if (actionHandlers) {
        for (const handler of actionHandlers) {
          if (handler.isActive === undefined || handler.isActive()) {
            // Pass the original event if available, otherwise create a minimal one
            const syntheticEvent = event ?? new KeyboardEvent("keydown");
            handler.callback(syntheticEvent);
          }
        }
      }
    },
    [handlers]
  );

  const hotkeys = useMemo<readonly HotkeyItem[]>(() => {
    return shortcutConfig.map(([hotkey, action, binding]) => [
      hotkey,
      (event: KeyboardEvent) => {
        triggerAction(action, event);
      },
      // Mantine swallows the key unless told otherwise, and that default was
      // being applied to Escape: every Escape press anywhere in the app was
      // consumed to close a popover that was usually not even mounted. A
      // binding that shares its key with the browser sets preventDefault
      // false and leaves the choice to the handler that actually acts.
      { preventDefault: binding?.preventDefault ?? true },
    ]);
  }, [triggerAction]);

  // useHotkeys expects a mutable array, so we need to cast it.
  useHotkeys(hotkeys as HotkeyItem[]);

  useUnhandledShortcutWarning(handlers);

  const contextValue = useMemo(
    () => ({ registerShortcut, triggerAction }),
    [registerShortcut, triggerAction]
  );

  return (
    <KeyboardShortcutContext.Provider value={contextValue}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}

/**
 * In development, name the shortcuts nothing is listening for.
 *
 * A key in `shortcutConfig` with no handler still binds, still swallows the
 * press, and still does nothing, with no build, lint or test failure anywhere,
 * so the only way to find out is to press it. That is a trap for anyone forking
 * this: removing a component removes its handler and leaves the key
 * advertised. bones shipped every one of its menu hints this way.
 *
 * One pass a second after mount, so components that register on their own
 * screens are not accused before they render. Bindings marked `onDemand` are
 * skipped entirely: their handler mounts with something transient, so its
 * absence is the normal case and naming it every time would turn this into
 * noise nobody reads. Development only: this is a message to whoever is adding
 * a shortcut, not to the person using the app.
 */
function useUnhandledShortcutWarning(
  handlers: Map<ShortcutActionType, Set<ShortcutHandler>>
): void {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const timer = setTimeout(() => {
      const orphans = shortcutConfig
        .filter(([, , binding]) => !binding?.onDemand)
        .filter(([, action]) => (handlers.get(action)?.size ?? 0) === 0)
        .map(([hotkey, action]) => `${hotkey} (${action})`);
      if (orphans.length > 0) {
        console.warn(
          `[shortcuts] bound but handled by nothing: ${orphans.join(", ")}. ` +
            "Either register a handler with useKeyboardShortcut or take it out " +
            "of src/config/keyboard-shortcuts.ts - a key that does nothing " +
            "still swallows the press."
        );
      }
    }, 1_000);
    return () => clearTimeout(timer);
  }, [handlers]);
}

export function useKeyboardShortcutContext(): KeyboardShortcutContextProps {
  const context = useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error("useKeyboardShortcutContext must be used within a KeyboardShortcutProvider");
  }
  return context;
}

/**
 * Custom hook to register a keyboard shortcut handler.
 *
 * @param action The shortcut action to listen for.
 * @param callback The function to execute when the shortcut is triggered.
 * @param isActive Optional function to determine if the shortcut is currently active.
 *                 Useful for shortcuts that should only work in specific contexts (e.g., modal open).
 * @param deps Optional dependency array for the callback function.
 */
export function useKeyboardShortcut(
  action: ShortcutActionType,
  callback: (event: KeyboardEvent) => void,
  isActive?: () => boolean,
  _deps: React.DependencyList = []
): void {
  const { registerShortcut } = useKeyboardShortcutContext();

  // Use refs to store the latest callback and isActive functions
  const callbackRef = useRef(callback);
  const isActiveRef = useRef(isActive);

  // Update refs when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
    isActiveRef.current = isActive;
  });

  // Create a stable handler object that uses the refs
  const handler = useMemo(
    () => ({
      action,
      callback: (event: KeyboardEvent) => callbackRef.current(event),
      isActive: () => (isActiveRef.current ? isActiveRef.current() : true),
    }),
    [action] // Only depend on action, which is stable
  );

  useEffect(() => {
    const unregister = registerShortcut(handler);

    // Cleanup function to unregister the shortcut when the component unmounts
    return () => {
      unregister();
    };
  }, [registerShortcut, handler]);
}
