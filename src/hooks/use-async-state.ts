import { useCallback, useState } from "react";

export interface AsyncState<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
	success: boolean;
}

export interface UseAsyncStateReturn<T, Args extends unknown[]> extends AsyncState<T> {
	execute: (...args: Args) => Promise<T>;
	reset: () => void;
	setData: (data: T | null) => void;
	setError: (error: string | null) => void;
}

/**
 * A hook for managing async operations with standardized loading, error, and success states.
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAsyncState(async (id: string) => {
 *   const response = await fetch(`/api/users/${id}`);
 *   return response.json();
 * });
 *
 * // Usage
 * const handleSubmit = () => execute(userId);
 * ```
 */
export function useAsyncState<T, Args extends unknown[]>(
	asyncFunction: (...args: Args) => Promise<T>,
	initialData: T | null = null
): UseAsyncStateReturn<T, Args> {
	const [data, setData] = useState<T | null>(initialData);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const execute = useCallback(
		async (...args: Args): Promise<T> => {
			setLoading(true);
			setError(null);
			setSuccess(false);

			try {
				const result = await asyncFunction(...args);
				setData(result);
				setSuccess(true);
				return result;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
				setError(errorMessage);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[asyncFunction]
	);

	const reset = useCallback(() => {
		setData(initialData);
		setLoading(false);
		setError(null);
		setSuccess(false);
	}, [initialData]);

	return {
		data,
		loading,
		error,
		success,
		execute,
		reset,
		setData,
		setError,
	};
}

/**
 * A simpler version for operations that don't return data
 */
export function useAsyncAction<Args extends unknown[]>(
	asyncFunction: (...args: Args) => Promise<void>
) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const execute = useCallback(
		async (...args: Args): Promise<void> => {
			setLoading(true);
			setError(null);
			setSuccess(false);

			try {
				await asyncFunction(...args);
				setSuccess(true);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
				setError(errorMessage);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[asyncFunction]
	);

	const reset = useCallback(() => {
		setLoading(false);
		setError(null);
		setSuccess(false);
	}, []);

	return {
		loading,
		error,
		success,
		execute,
		reset,
		setError,
	};
}

/**
 * Hook for managing multiple async operations with independent states
 */
export function useMultiAsyncState<T extends Record<string, unknown>>() {
	const [states, setStates] = useState<Record<keyof T, AsyncState<unknown>>>(
		{} as Record<keyof T, AsyncState<unknown>>
	);

	const createExecutor = useCallback(
		<K extends keyof T>(key: K, asyncFunction: () => Promise<T[K]>) => {
			return async () => {
				setStates((prev: Record<keyof T, AsyncState<unknown>>) => ({
					...prev,
					[key]: { ...prev[key], loading: true, error: null, success: false },
				}));

				try {
					const result = await asyncFunction();
					setStates((prev: Record<keyof T, AsyncState<unknown>>) => ({
						...prev,
						[key]: { data: result, loading: false, error: null, success: true },
					}));
					return result;
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
					setStates((prev: Record<keyof T, AsyncState<unknown>>) => ({
						...prev,
						[key]: { ...prev[key], loading: false, error: errorMessage, success: false },
					}));
					throw err;
				}
			};
		},
		[]
	);

	const getState = useCallback(
		<K extends keyof T>(key: K): AsyncState<T[K]> => {
			return (
				(states[key] as AsyncState<T[K]>) || {
					data: null,
					loading: false,
					error: null,
					success: false,
				}
			);
		},
		[states]
	);

	const reset = useCallback(<K extends keyof T>(key?: K) => {
		if (key) {
			setStates((prev: Record<keyof T, AsyncState<unknown>>) => ({
				...prev,
				[key]: { data: null, loading: false, error: null, success: false },
			}));
		} else {
			setStates({} as Record<keyof T, AsyncState<unknown>>);
		}
	}, []);

	return {
		createExecutor,
		getState,
		reset,
		states,
	};
}
