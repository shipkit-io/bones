import fs from "fs/promises";
import path from "path";

interface BlockConfig {
	// The name of the block (e.g., "login-01")
	name: string;
	// Description of the block
	description?: string;
	// Type of registry item (default: "registry:block")
	type?: string;
	// Source directory containing the block files
	sourceDir: string;
	// Registry dependencies (e.g., ["button", "card", "input"])
	registryDependencies?: string[];
	// NPM dependencies
	dependencies?: string[];
	// Categories for the block
	categories?: string[];
	// File mappings from source to target
	files: {
		// Source path relative to sourceDir
		source: string;
		// Target path in the registry
		target?: string;
		// Type of file (default: "registry:component")
		type?: string;
	}[];
}

interface GeneratorOptions {
	// Directory containing block directories
	blocksDir: string;
	// Output directory for JSON files
	outputDir: string;
	// Optional base configuration for all blocks
	baseConfig?: Partial<BlockConfig>;
	// Optional function to transform content before writing
	contentTransform?: (content: string) => string;
}

async function readFileContent(filePath: string): Promise<string> {
	try {
		return await fs.readFile(filePath, "utf-8");
	} catch (error) {
		throw new Error(`Failed to read file ${filePath}: ${error}`);
	}
}

async function writeJsonFile(filePath: string, content: any): Promise<void> {
	try {
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, JSON.stringify(content, null, 2), "utf-8");
	} catch (error) {
		throw new Error(`Failed to write file ${filePath}: ${error}`);
	}
}

export async function generateBlockJson(
	blockConfig: BlockConfig,
	options: GeneratorOptions
): Promise<void> {
	const {
		name,
		description,
		type = "registry:block",
		sourceDir,
		registryDependencies = [],
		dependencies = [],
		categories = [],
		files: fileConfigs,
	} = blockConfig;

	const files = await Promise.all(
		fileConfigs.map(async (file) => {
			const sourcePath = path.join(sourceDir, file.source);
			let content = await readFileContent(sourcePath);

			if (options.contentTransform) {
				content = options.contentTransform(content);
			}

			return {
				path: file.source,
				content,
				type: file.type || "registry:component",
				target: file.target || "",
			};
		})
	);

	const blockJson = {
		name,
		type,
		...(description && { description }),
		...(dependencies.length > 0 && { dependencies }),
		...(registryDependencies.length > 0 && { registryDependencies }),
		...(categories.length > 0 && { categories }),
		files,
	};

	const outputPath = path.join(options.outputDir, "styles", "default", `${name}.json`);

	await writeJsonFile(outputPath, blockJson);
}

export async function generateAllBlocks(options: GeneratorOptions): Promise<void> {
	const blockDirs = await fs.readdir(options.blocksDir);

	for (const blockDir of blockDirs) {
		const blockPath = path.join(options.blocksDir, blockDir);
		const stat = await fs.stat(blockPath);
		console.log("Processing block:", blockPath);

		if (!stat.isDirectory()) continue;

		// Look for a block.config.json in the block directory
		const configPath = path.join(blockPath, "block.config.json");
		let blockConfig: BlockConfig;

		try {
			const configContent = await readFileContent(configPath);
			console.log("Found config:", configPath);
			blockConfig = {
				...options.baseConfig,
				...JSON.parse(configContent),
				sourceDir: blockPath,
			};
		} catch (error) {
			console.error(`Error processing config for ${blockDir}:`, error);
			continue;
		}

		await generateBlockJson(blockConfig, options);
	}
}

// Example usage:
// const options: GeneratorOptions = {
//   blocksDir: './blocks',
//   outputDir: './registry',
//   baseConfig: {
//     type: 'registry:block',
//     dependencies: ['react', 'next']
//   },
//   contentTransform: (content) => content.replace(/from "@\//g, 'from "@/registry/default/')
// };
//
// await generateAllBlocks(options);
