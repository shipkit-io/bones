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
		return shortcutConfig.map(([hotkey, action]) => [
			hotkey,
			(event: KeyboardEvent) => {
				// Prevent default browser behavior for handled shortcuts if necessary
				// event.preventDefault(); // Uncomment if needed for specific shortcuts
				triggerAction(action, event);
			},
		]);
	}, [triggerAction]);

	// useHotkeys expects a mutable array, so we need to cast it.
	useHotkeys(hotkeys as HotkeyItem[]);

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
