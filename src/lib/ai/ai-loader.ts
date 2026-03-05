import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";

export interface ProjectStructure {
	root: string;
	directories: {
		app: string[];
		components: string[];
		lib: string[];
		server: string[];
		config: string[];
	};
	keyFiles: Record<string, string>;
}

export interface TechnologyStack {
	framework: string;
	language: string;
	styling: string[];
	ui: string[];
	state: string[];
	database: string;
	cms: string;
	email: string;
	auth: string;
	packageManager: string;
}

export interface AIContext {
	projectName: string;
	description: string;
	version: string;
	technologies: TechnologyStack;
	structure: ProjectStructure;
	conventions: {
		files: string[];
		components: string[];
		database: string[];
		api: string[];
	};
	routes: typeof routes;
	config: typeof siteConfig;
}

/**
 * AILoader provides context and information about the project to AI assistants
 * to help them understand the codebase and make informed decisions.
 */
export class AILoader {
	private context: AIContext;

	constructor() {
		this.context = {
			projectName: "Shipkit",
			description: "Production-ready SaaS starter kit built with Next.js",
			version: "1.0.0",
			technologies: {
				framework: "Next.js (App Router)",
				language: "TypeScript",
				styling: ["Tailwind CSS", "CSS Modules"],
				ui: ["Shadcn/UI", "Radix UI", "Lucide Icons"],
				state: ["React Context", "Zustand"],
				database: "PostgreSQL with Drizzle ORM",
				cms: "Payload CMS 3",
				email: "Resend",
				auth: "NextAuth/AuthJS v5",
				packageManager: "Bun",
			},
			structure: {
				root: "/",
				directories: {
					app: [
						"(admin)",
						"ai",
						"(auth)",
						"(builder)",
						"(dashboard)",
						"(docs)",
						"(landing)",
						"api",
					],
					components: ["blocks", "builder", "headers", "primitives", "ui"],
					lib: ["ai", "auth", "db", "utils"],
					server: ["actions", "services", "db"],
					config: ["routes.ts", "site.ts", "env.ts"],
				},
				keyFiles: {
					"package.json": "Project dependencies and scripts",
					"tsconfig.json": "TypeScript configuration",
					"tailwind.config.js": "Tailwind CSS configuration",
					"drizzle.config.ts": "Database configuration",
					"next.config.js": "Next.js configuration",
				},
			},
			conventions: {
				files: [
					"Use hyphen-case for file names (e.g., user-profile.tsx)",
					"Group related files in directories",
					"Use .module.css for CSS Modules",
					"Keep components and their styles together",
				],
				components: [
					"Prefer server components by default",
					"Use 'use client' directive for client components",
					"Don't nest server components in client components",
					"Keep components focused and reusable",
					"Use TypeScript for type safety",
				],
				database: [
					"Use Drizzle migrations for schema changes",
					"Keep schema files organized by feature",
					"Use meaningful table and column names",
					"Add proper indexes for performance",
				],
				api: [
					"Use server actions for mutations",
					"Keep API routes organized by feature",
					"Implement proper error handling",
					"Add request validation",
				],
			},
			routes,
			config: siteConfig,
		};
	}

	/**
	 * Get the full context about the project
	 */
	public getContext(): AIContext {
		return this.context;
	}

	/**
	 * Get information about specific technology or feature
	 */
	public getTechnology(key: keyof TechnologyStack): string | string[] {
		return this.context.technologies[key];
	}

	/**
	 * Get project structure information
	 */
	public getStructure(): ProjectStructure {
		return this.context.structure;
	}

	/**
	 * Get coding conventions
	 */
	public getConventions(type: keyof AIContext["conventions"]): string[] {
		return this.context.conventions[type];
	}

	/**
	 * Get route configuration
	 */
	public getRoutes(): typeof routes {
		return this.context.routes;
	}

	/**
	 * Get site configuration
	 */
	public getSiteConfig(): typeof siteConfig {
		return this.context.config;
	}
}

// Export a singleton instance
export const aiLoader = new AILoader();
