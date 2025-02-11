import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

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
			...ts.configs.recommended.rules,
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/consistent-type-imports": [
				"warn",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports",
				},
			],
			// "@typescript-eslint/ban-ts-comment": "off",
			// "@typescript-eslint/no-unsafe-argument": "off",
			// "@typescript-eslint/no-unsafe-assignment": "off",
			// "@typescript-eslint/no-unsafe-call": "off",
			// "@typescript-eslint/no-unsafe-member-access": "off",
			// "@typescript-eslint/no-unsafe-return": "off",
			// "@typescript-eslint/no-explicit-any": "off",
			// "react/no-unescaped-entities": "off",
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
		"next/typescript"
	),
];

export default eslintConfig;
