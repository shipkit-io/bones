"use client";

import { useEffect, useState } from "react";
import { fetchRegistryIndex, getRegistries } from "../_lib/registry-service";
import type { Registry, RegistryFilters, RegistryItem } from "../_lib/types";

export function useRegistry() {
	const [registries, setRegistries] = useState<Registry[]>([]);
	const [currentRegistry, setCurrentRegistry] = useState<Registry | undefined>(
		undefined,
	);
	const [items, setItems] = useState<Record<string, RegistryItem[]>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [filters, setFilters] = useState<RegistryFilters>({
		type: "all",
		category: "all",
	});
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const loadRegistries = async () => {
			try {
				const registries = await getRegistries();
				setRegistries(registries);
			} catch (error) {
				setError(
					error instanceof Error
						? error
						: new Error("Failed to load registries"),
				);
			}
		};
		loadRegistries();
	}, []);

	useEffect(() => {
		const loadItems = async () => {
			setLoading(true);
			setError(null);
			try {
				if (currentRegistry) {
					const registryItems = await fetchRegistryIndex(currentRegistry.url);
					if (Array.isArray(registryItems) && registryItems.length > 0) {
						setItems({
							[currentRegistry.name]: registryItems.map((item) => ({
								...item,
								registry: currentRegistry.name,
								componentUrl: `${currentRegistry.baseComponentUrl}/default/${item.name}.json`,
							})),
						});
					} else {
						// If current registry is invalid, clear it and items
						setCurrentRegistry(undefined);
						setItems({});
					}
				} else {
					const allItems: Record<string, RegistryItem[]> = {};

					for (const registry of registries) {
						const items = await fetchRegistryIndex(registry.url);
						if (Array.isArray(items) && items.length > 0) {
							allItems[registry.name] = items.map((item) => ({
								...item,
								registry: registry.name,
								componentUrl: `${registry.baseComponentUrl}/default/${item.name}.json`,
							}));
						}
					}

					if (Object.keys(allItems).length > 0) {
						setItems(allItems);
					} else {
						setItems({});
					}
				}
			} catch (error) {
				// Silently handle any remaining errors
				setItems({});
			} finally {
				setLoading(false);
			}
		};
		if (registries.length > 0) {
			loadItems();
		}
	}, [currentRegistry, registries]);

	const getCategories = () => {
		const categories = new Set<string>();
		for (const registryItems of Object.values(items)) {
			for (const item of registryItems) {
				if (item.categories) {
					for (const category of item.categories) {
						categories.add(category);
					}
				}
			}
		}
		return Array.from(categories);
	};

	const getTypes = () => {
		const types = new Set<string>();
		for (const registryItems of Object.values(items)) {
			for (const item of registryItems) {
				types.add(item.type);
			}
		}
		return Array.from(types);
	};

	const filteredItems = () => {
		const allItems = Object.values(items).flat();
		const filtered = allItems.filter((item) => {
			// Type filter
			if (filters.type && filters.type !== "all") {
				if (filters.type === "components" && item.type !== "registry:ui") {
					return false;
				}
				if (filters.type === "blocks" && item.type !== "registry:block") {
					return false;
				}
			}

			// Category filter
			if (filters.category && filters.category !== "all") {
				if (!item.categories?.includes(filters.category)) {
					return false;
				}
			}

			// Search query
			if (searchQuery) {
				const searchString = `${item.name} ${item.description}`.toLowerCase();
				return searchString.includes(searchQuery.toLowerCase());
			}

			return true;
		});

		// Sort by name
		return filtered.sort((a: RegistryItem, b: RegistryItem) =>
			a.name.localeCompare(b.name),
		);
	};

	return {
		registries,
		currentRegistry,
		items,
		loading,
		error,
		filters,
		searchQuery,
		setCurrentRegistry,
		setFilters,
		setSearchQuery,
		getCategories,
		getTypes,
		setRegistries,
		filteredItems,
	};
}
