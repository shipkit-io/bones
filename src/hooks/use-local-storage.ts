"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(
	key: string,
	initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
	// Get from local storage then
	// parse stored json or return initialValue
	const readValue = (): T => {
		// Prevent build error "window is undefined" but keep working
		if (typeof window === "undefined") {
			return initialValue;
		}

		try {
			const item = window.localStorage.getItem(key);
			if (!item) return initialValue;
			const parsed = JSON.parse(item) as T;
			// Handle case where localStorage contains "null" or invalid data
			return parsed ?? initialValue;
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error);
			return initialValue;
		}
	};

	// State to store our value
	// Pass initial state function to useState so logic is only executed once
	const [storedValue, setStoredValue] = useState<T>(readValue);

	// Stable setter that updates state; localStorage sync happens in an effect
	const setValue = useCallback(
		(value: T | ((val: T) => T)) => {
			try {
				setStoredValue((prev) =>
					value instanceof Function ? (value as (val: T) => T)(prev) : value
				);
			} catch (error) {
				console.warn(`Error setting localStorage key "${key}":`, error);
			}
		},
		[key]
	);

	useEffect(() => {
		setStoredValue(readValue());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === key) {
				// Handle null value (item was removed)
				if (event.newValue === null) {
					setStoredValue(initialValue);
					return;
				}

				// Safely parse the new value with error handling
				try {
					const parsedValue = JSON.parse(event.newValue) as T;
					setStoredValue(parsedValue);
				} catch (error) {
					console.warn(`Error parsing localStorage change for key "${key}":`, error);
					// If parsing fails, try to read directly from localStorage
					// This handles edge cases where the event data might be corrupted
					try {
						const item = window.localStorage.getItem(key);
						if (item !== null) {
							const fallbackValue = JSON.parse(item) as T;
							setStoredValue(fallbackValue);
						} else {
							setStoredValue(initialValue);
						}
					} catch (fallbackError) {
						console.warn(`Fallback parsing also failed for key "${key}":`, fallbackError);
						setStoredValue(initialValue);
					}
				}
			}
		};

		// Listen for changes to this local storage key in other tabs/windows
		window.addEventListener("storage", handleStorageChange);
		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [key, initialValue]);

	// Persist to localStorage whenever value or key changes
	useEffect(() => {
		try {
			if (typeof window !== "undefined") {
				window.localStorage.setItem(key, JSON.stringify(storedValue));
			}
		} catch (error) {
			console.warn(`Error persisting localStorage key "${key}":`, error);
		}
	}, [key, storedValue]);

	return [storedValue, setValue];
}
