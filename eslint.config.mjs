import { dirname } from "path";
import { fileURLToPath } from "url";
// @ts-nocheck
import { FlatCompat } from "@eslint/eslintrc";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: ts.configs["recommended-type-checked"],
	stylisticConfig: ts.configs["stylistic-type-checked"],
});

/** @type {Array<import('eslint').Linter.FlatConfig>} */
const eslintConfig = [
	// Base config for all files
	{
		languageOptions: {
			parserOptions: {
				project: ["./tsconfig.json"],
				tsconfigRootDir: __dirname,
			},
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	},

	// TypeScript files configuration
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: ["./tsconfig.json"],
				tsconfigRootDir: __dirname,
				ecmaVersion: "latest",
				sourceType: "module",
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			"@typescript-eslint": ts,
		},
		rules: {
			// Disable specific TypeScript rules
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"react/no-unescaped-entities": "off",

			// Type imports configuration
			"@typescript-eslint/consistent-type-imports": [
				"warn",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports",
				},
			],

			// Unused variables configuration
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
				},
			],
		},
	},

	// Configure global ignores (replaces .eslintignore)
	{
		ignores: [
			"node_modules/**",
			".cursor/**",
			".next/**",
			"src/components/blocks/**",
			"src/components/ui/**",
			"src/lib/**",
			"src/hooks/use-toast.tsx",
			"src/hooks/use-copy-to-clipboard.ts",
			"src/hooks/use-mobile.tsx",
			"src/hooks/use-mutation-observer.ts",
			"src/hooks/use-sidebar.tsx",
			"src/app/(demo)/**/*",
		],
	},

	// Extend configurations
	...compat.extends(
		"plugin:@typescript-eslint/recommended-type-checked",
		"plugin:@typescript-eslint/stylistic-type-checked",
		"next/core-web-vitals",
		"next/typescript",
		"plugin:prettier/recommended",
	),

	// Add Prettier last
	prettier,
];

export default eslintConfig;
