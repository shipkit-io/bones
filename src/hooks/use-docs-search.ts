"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface DocSearchResult {
	title: string;
	content: string;
	url: string;
	section?: string;
}

interface UseDocsSearchOptions {
	/**
	 * Debounce delay in milliseconds
	 * @default 300
	 */
	debounceDelay?: number;
	/**
	 * Minimum query length to trigger search
	 * @default 2
	 */
	minQueryLength?: number;
	/**
	 * Maximum number of results to fetch
	 * @default 10
	 */
	limit?: number;
}

interface UseDocsSearchReturn {
	query: string;
	setQuery: (query: string) => void;
	results: DocSearchResult[];
	isLoading: boolean;
	error: string | null;
	search: (searchQuery?: string) => Promise<void>;
	clearResults: () => void;
	hasSearched: boolean;
}

/**
 * Hook for managing docs search functionality with debouncing and caching
 */
export function useDocsSearch(options: UseDocsSearchOptions = {}): UseDocsSearchReturn {
	const { debounceDelay = 300, minQueryLength = 2, limit = 10 } = options;

	const [query, setQuery] = useState("");
	const [results, setResults] = useState<DocSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);

	// Cache for search results
	const cacheRef = useRef(new Map<string, DocSearchResult[]>());
	const abortControllerRef = useRef<AbortController | null>(null);
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	/**
	 * Perform search API call
	 */
	const performSearch = useCallback(
		async (searchQuery: string): Promise<DocSearchResult[]> => {
			// Check cache first
			const cacheKey = `${searchQuery.toLowerCase().trim()}_${limit}`;
			const cached = cacheRef.current.get(cacheKey);
			if (cached) {
				return cached;
			}

			// Cancel previous request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Create new abort controller
			abortControllerRef.current = new AbortController();

			try {
				const response = await fetch("/api/docs/search", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify({
						query: searchQuery.trim(),
						limit,
					}),
					signal: abortControllerRef.current.signal,
				});

				if (!response.ok) {
					throw new Error(`Search failed: ${response.statusText}`);
				}

				const data = await response.json();
				const searchResults = data.results || [];

				// Cache the results
				cacheRef.current.set(cacheKey, searchResults);

				// Limit cache size to prevent memory issues
				if (cacheRef.current.size > 100) {
					const firstKey = cacheRef.current.keys().next().value;
					if (firstKey) {
						cacheRef.current.delete(firstKey);
					}
				}

				return searchResults;
			} catch (err) {
				if (err instanceof Error && err.name === "AbortError") {
					// Request was cancelled, don't treat as error
					throw err;
				}
				throw new Error(err instanceof Error ? err.message : "Search failed");
			}
		},
		[limit]
	);

	/**
	 * Execute search with loading states and error handling
	 */
	const search = useCallback(
		async (searchQuery?: string) => {
			const queryToSearch = searchQuery ?? query;

			if (!queryToSearch.trim() || queryToSearch.length < minQueryLength) {
				setResults([]);
				setError(null);
				setHasSearched(false);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const searchResults = await performSearch(queryToSearch);
				setResults(searchResults);
				setHasSearched(true);
			} catch (err) {
				if (err instanceof Error && err.name === "AbortError") {
					// Request was cancelled, don't update state
					return;
				}

				const errorMessage = err instanceof Error ? err.message : "Search failed";
				setError(errorMessage);
				setResults([]);
				setHasSearched(true);
			} finally {
				setIsLoading(false);
			}
		},
		[query, minQueryLength, performSearch]
	);

	/**
	 * Clear search results and reset state
	 */
	const clearResults = useCallback(() => {
		setQuery("");
		setResults([]);
		setError(null);
		setHasSearched(false);

		// Cancel any pending requests
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Clear debounce timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}
	}, []);

	/**
	 * Debounced search effect
	 */
	useEffect(() => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		if (query.trim() && query.length >= minQueryLength) {
			debounceTimeoutRef.current = setTimeout(() => {
				void search(query);
			}, debounceDelay);
		} else {
			setResults([]);
			setError(null);
			setHasSearched(false);
		}

		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, [query, minQueryLength, debounceDelay, search]);

	/**
	 * Cleanup on unmount
	 */
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, []);

	return {
		query,
		setQuery,
		results,
		isLoading,
		error,
		search,
		clearResults,
		hasSearched,
	};
}
