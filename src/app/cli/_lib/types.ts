/**
 * Registry types for the component browser
 * @see https://ui.shadcn.com/docs/cli
 */

export interface Registry {
	name: string;
	url: string;
	description?: string;
	baseComponentUrl: string;
	baseBlockUrl: string;
	baseDocsUrl: string;
	custom?: boolean;
}

export interface RegistryItem {
	name: string;
	type:
	| "registry:block"
	| "registry:ui"
	| "registry:hook"
	| "registry:lib"
	| "registry:component"
	| "registry:theme"
	| "registry:page";
	description?: string;
	dependencies?: string[];
	categories?: string[];
	componentUrl?: string;
	style?: string;
	files?: Array<{
		path: string;
		content?: string;
		type?:
		| "preview"
		| "ui"
		| "block"
		| "hook"
		| "lib"
		| "component"
		| "theme"
		| "page";
		target?: string;
	}>;
	registryDependencies?: string[];
	registry?: string;
	meta?: {
		library?: string;
		hasPreview?: boolean;
		[key: string]: any;
	};
}

export interface RegistryFilters {
	type?: "all" | "components" | "blocks";
	category?: string;
	style?: string;
}

export interface InstallOptions {
	overwrite?: boolean;
	style?: string;
	typescript?: boolean;
	path?: string;
}
