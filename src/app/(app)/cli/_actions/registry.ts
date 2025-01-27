"use server";

import { exec } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

const ComponentsConfigSchema = z.object({
	aliases: z.object({
		components: z.string(),
		ui: z.string(),
		utils: z.string(),
		lib: z.string(),
		hooks: z.string(),
	}),
});

type ComponentsConfig = z.infer<typeof ComponentsConfigSchema>;

/**
 * Get the project root directory
 */
async function getProjectRoot(): Promise<string> {
	try {
		const { stdout } = await execAsync("git rev-parse --show-toplevel");
		return stdout.trim();
	} catch (error) {
		throw new Error("Not in a git repository");
	}
}

/**
 * Get project dependencies from package.json
 */
export async function getDependencies(): Promise<{
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
}> {
	try {
		const projectRoot = await getProjectRoot();
		const packageJsonPath = path.join(projectRoot, "package.json");
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
			dependencies: Record<string, string>;
			devDependencies: Record<string, string>;
		};

		return {
			dependencies: packageJson.dependencies || {},
			devDependencies: packageJson.devDependencies || {},
		};
	} catch (error) {
		throw new Error("Failed to read package.json");
	}
}

/**
 * Get the components configuration from components.json
 */
async function getComponentsConfig(): Promise<ComponentsConfig> {
	try {
		const projectRoot = await getProjectRoot();
		const configPath = path.join(projectRoot, "components.json");
		const config = JSON.parse(readFileSync(configPath, "utf-8"));
		return ComponentsConfigSchema.parse(config);
	} catch (error) {
		throw new Error("Failed to read components.json");
	}
}

/**
 * Get installed components from the components directory
 */
export async function getInstalledComponents(): Promise<string[]> {
	try {
		const config = await getComponentsConfig();
		const projectRoot = await getProjectRoot();

		// Get the actual filesystem path from the ui alias
		// The alias is typically "@/components/ui", we need to convert it to the actual path
		const uiPath = config.aliases.ui.replace("@/", "src/");
		const componentsDir = path.join(projectRoot, uiPath);

		try {
			// Check if directory exists
			const stats = statSync(componentsDir);
			if (!stats.isDirectory()) {
				console.error("UI components path is not a directory:", componentsDir);
				return [];
			}

			// Read the directory and filter for .tsx files
			const components = readdirSync(componentsDir)
				.filter((file) => file.endsWith(".tsx"))
				.map((file) => file.replace(".tsx", ""));

			return components;
		} catch (error: any) {
			if (error.code === "ENOENT") {
				console.error("UI components directory does not exist:", componentsDir);
			} else {
				console.error("Error reading UI components directory:", error);
			}
			return [];
		}
	} catch (error) {
		console.error("Error getting installed components:", error);
		return [];
	}
}
