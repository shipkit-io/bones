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
		description:
			"Official shadcn/ui component registry with customizable components and blocks",
		baseComponentUrl: "https://ui.shadcn.com/registry/styles",
		baseBlockUrl: "https://ui.shadcn.com/registry/blocks",
		baseDocsUrl: "https://ui.shadcn.com/docs/components",
	},
	{
		name: "Magic UI",
		url: "https://magicui.design/r/index.json",
		description:
			"Beautiful animated components and effects for modern web applications",
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
export async function getRegistries(): Promise<Registry[]> {
	return [...BUILT_IN_REGISTRIES, ...getCustomRegistries()];
}

/**
 * Validate a registry URL and structure
 * @throws Error if the registry is invalid
 */
export async function validateRegistry(registry: Registry): Promise<void> {
	// Check if registry with this name already exists
	const existingRegistries = await getRegistries();
	if (existingRegistries.some((r) => r.name === registry.name)) {
		throw new Error(`Registry "${registry.name}" already exists`);
	}

	try {
		// Ensure URL ends with index.json for registry indexes
		const url = registry.url.endsWith("index.json")
			? registry.url
			: registry.url.endsWith("/")
				? `${registry.url}index.json`
				: `${registry.url}/index.json`;

		// Try to fetch the registry index
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch registry: ${response.statusText}`);
		}

		// Validate the registry structure
		const items = await response.json();
		if (!Array.isArray(items)) {
			throw new Error("Registry index must be an array");
		}

		// Validate at least one item has the correct structure
		if (items.length === 0) {
			throw new Error("Registry is empty");
		}

		const validItem = items.some(
			(item) =>
				typeof item === "object" &&
				item !== null &&
				typeof item.name === "string" &&
				typeof item.type === "string" &&
				(item.type === "registry:ui" || item.type === "registry:block"),
		);

		if (!validItem) {
			throw new Error("Registry does not contain valid components");
		}
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Failed to validate registry");
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
 * Get a specific registry by name
 */
export async function getRegistry(name: RegistryName): Promise<Registry> {
	const registry = [...BUILT_IN_REGISTRIES, ...getCustomRegistries()].find(
		(r) => r.name === name,
	);
	if (!registry) {
		throw new Error(`Registry ${name} not found`);
	}
	return registry;
}

/**
 * Fetch registry index with error handling and caching
 */
export async function fetchRegistryIndex(
	registryUrl: string,
): Promise<RegistryItem[]> {
	const url = new URL(
		registryUrl.endsWith("index.json")
			? registryUrl
			: `${registryUrl.replace(/\/$/, "")}/index.json`,
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
	style = "default",
): Promise<RegistryItem> {
	const baseUrlWithoutIndex = baseUrl.replace(/\/index\.json$/, "");
	const detailsUrl = new URL(
		`${baseUrlWithoutIndex}/styles/${style}/${itemName}.json`,
	);

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
export function categorizeItems(
	items: RegistryItem[],
): Record<string, RegistryItem[]> {
	return items.reduce(
		(acc, item) => {
			const category = item.type === "registry:block" ? "Blocks" : "Components";
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(item);
			return acc;
		},
		{} as Record<string, RegistryItem[]>,
	);
}

/**
 * Group items by their categories
 */
export function groupItemsByType(
	items: RegistryItem[],
): Record<string, RegistryItem[]> {
	return items.reduce(
		(acc, item) => {
			const categories = item.categories || ["Uncategorized"];
			for (const category of categories) {
				if (!acc[category]) {
					acc[category] = [];
				}
				acc[category].push(item);
			}
			return acc;
		},
		{} as Record<string, RegistryItem[]>,
	);
}

/**
 * Search and filter items
 */
export function searchItems(
	items: RegistryItem[] | { [key: string]: RegistryItem[] },
	query = "",
	filters: RegistryFilters = {},
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
export function getInstallCommand(
	component: RegistryItem,
	registry?: Registry,
) {
	const componentUrl =
		component.componentUrl ||
		`${registry?.baseComponentUrl}/default/${component.name}.json`;
	return `npx shadcn@latest add "${componentUrl}"`;
}

/**
 * Get the documentation URL for a component
 */
export function getDocumentationUrl(
	component: RegistryItem,
	registry?: Registry,
): string | undefined {
	if (!registry?.baseDocsUrl) return undefined;
	return `${registry.baseDocsUrl}/${component.name}`;
}
