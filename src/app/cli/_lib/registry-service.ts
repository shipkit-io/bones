import type { Registry, RegistryFilters, RegistryItem } from "./types";

/**
 * Built-in registries for the component browser
 * @see https://ui.shadcn.com/docs/cli
 * @see https://magicui.design
 * @see https://cli.bones.sh
 */
const BUILT_IN_REGISTRIES = [
	{
		name: "shadcn/ui",
		url: "https://ui.shadcn.com/r",
		description: "Official shadcn/ui component registry with customizable components and blocks",
		baseComponentUrl: "https://ui.shadcn.com/registry/styles",
		baseBlockUrl: "https://ui.shadcn.com/registry/blocks",
		baseDocsUrl: "https://ui.shadcn.com/docs/components",
	},
	{
		name: "Magic UI",
		url: "https://magicui.design/r/index.json",
		description: "Beautiful animated components and effects for modern web applications",
		baseComponentUrl: "https://magicui.design/registry/styles",
		baseBlockUrl: "https://magicui.design/registry/blocks",
		baseDocsUrl: "https://magicui.design/docs/components",
	},
	{
		name: "Bones Registry",
		url: "https://cli.bones.sh",
		description: "Community-driven component registry",
		baseComponentUrl: "https://cli.bones.sh",
		baseBlockUrl: "https://cli.bones.sh",
		baseDocsUrl: "https://cli.bones.sh/docs/components",
	},
] as const;

const STORAGE_KEY = "reg-browser:custom-registries";

const DEFAULT_REGISTRY_URL = "https://ui.shadcn.com/r";

export type RegistryName = (typeof BUILT_IN_REGISTRIES)[number]["name"];

/**
 * Get custom registries from local storage
 */
function getCustomRegistries(): Registry[] {
	if (typeof window === "undefined") return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (error) {
		console.error("Failed to parse custom registries:", error);
		return [];
	}
}

/**
 * Save custom registries to local storage
 */
function saveCustomRegistries(registries: Registry[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(registries));
	} catch (error) {
		console.error("Failed to save custom registries:", error);
	}
}

/**
 * Get all available registries
 */
export function getRegistries(): Registry[] {
	return [...BUILT_IN_REGISTRIES, ...getCustomRegistries()];
}

/**
 * Validate a registry URL and structure
 * @throws Error if the registry is invalid
 */
export async function validateRegistry(registry: Registry): Promise<void> {
	try {
		const response = await fetch(registry.url);
		if (!response.ok) {
			throw new Error(`Failed to fetch registry: ${response.statusText}`);
		}
	} catch (error) {
		throw new Error(
			`Invalid registry URL: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
}

/**
 * Add a custom registry
 */
export async function addCustomRegistry(registry: Registry): Promise<void> {
	await validateRegistry(registry);
	const customRegistries = getCustomRegistries();
	customRegistries.push(registry);
	saveCustomRegistries(customRegistries);
}

/**
 * Remove a custom registry
 */
export function removeCustomRegistry(name: string): void {
	const customRegistries = getCustomRegistries();
	const filtered = customRegistries.filter((r) => r.name !== name);
	saveCustomRegistries(filtered);
}

/**
 * Get a registry by name
 */
export function getRegistry(name: RegistryName): Registry {
	return (
		[...BUILT_IN_REGISTRIES, ...getCustomRegistries()].find((r) => r.name === name) ??
		BUILT_IN_REGISTRIES[0]
	);
}

/**
 * Fetch registry index with error handling and caching
 */
export async function fetchRegistryIndex(registryUrl: string): Promise<RegistryItem[]> {
	const url = new URL(
		registryUrl.endsWith("index.json")
			? registryUrl
			: `${registryUrl.replace(/\/$/, "")}/index.json`
	);

	try {
		const response = await fetch(url, {
			next: { revalidate: 3600 }, // Cache for 1 hour
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch registry: ${response.statusText}`);
		}

		return response.json();
	} catch (error) {
		console.error(`Failed to fetch registry index from ${url}:`, error);
		throw error;
	}
}

/**
 * Fetch item details with error handling and caching
 */
export async function fetchItemDetails(
	baseUrl: string,
	itemName: string,
	style = "default"
): Promise<RegistryItem> {
	const baseUrlWithoutIndex = baseUrl.replace(/\/index\.json$/, "");
	const detailsUrl = new URL(`${baseUrlWithoutIndex}/styles/${style}/${itemName}.json`);

	try {
		const response = await fetch(detailsUrl, {
			next: { revalidate: 3600 }, // Cache for 1 hour
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch item details: ${response.statusText}`);
		}

		const data = await response.json();
		return {
			...data,
			componentUrl: detailsUrl.toString(),
		};
	} catch (error) {
		console.error(`Failed to fetch item details from ${detailsUrl}:`, error);
		throw error;
	}
}

/**
 * Categorize items by type (Components/Blocks)
 */
export function categorizeItems(items: RegistryItem[]): Record<string, RegistryItem[]> {
	return items.reduce(
		(acc, item) => {
			const category = item.type === "registry:block" ? "Blocks" : "Components";
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(item);
			return acc;
		},
		{} as Record<string, RegistryItem[]>
	);
}

/**
 * Group items by their categories
 */
export function groupItemsByType(items: RegistryItem[]): Record<string, RegistryItem[]> {
	const types = items.reduce(
		(acc, item) => {
			const type = item.type ?? "component";
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push(item);
			return acc;
		},
		{} as Record<string, RegistryItem[]>
	);

	return types;
}

/**
 * Search and filter items
 */
export function searchItems(
	items: RegistryItem[] | Record<string, RegistryItem[]>,
	query = "",
	filters: RegistryFilters = {}
): RegistryItem[] {
	// Convert items object to array if needed
	const itemsArray = Array.isArray(items) ? items : Object.values(items).flat();

	return itemsArray.filter((item) => {
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
		if (query) {
			const searchString = `${item.name} ${item.description}`.toLowerCase();
			return searchString.includes(query.toLowerCase());
		}

		return true;
	});
}

/**
 * Get the install command for a component
 * @see https://ui.shadcn.com/docs/cli
 */
export function getInstallCommand(component: RegistryItem, registry?: Registry): string {
	const registryUrl = registry?.url ?? DEFAULT_REGISTRY_URL;
	return `npx shadcn-custom add "${registryUrl}/${component.name}"`;
}

/**
 * Get the documentation URL for a component
 */
export function getDocumentationUrl(component: RegistryItem, registry?: Registry): string {
	const registryUrl = registry?.url ?? DEFAULT_REGISTRY_URL;
	return `${registryUrl}/docs/${component.name}`;
}
