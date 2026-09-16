import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-config-next 16 ships native flat configs, so they are imported directly.
// The old FlatCompat bridge (@eslint/eslintrc) cannot convert them ("Converting circular
// structure to JSON") and ESLint 10 dropped eslintrc support from core.
const eslintConfig = tseslint.config(
	// Configure global ignores (replaces .eslintignore)
	{
		ignores: [
			"node_modules/**",
			".cursor/**",
			".next/**",
			"src/app/(demo)/**/*",
			"src/components/blocks/**",
			"src/components/ui/**",
		],
	},

	// Base config for all files
	{
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	},

	// Extend configurations
	...nextCoreWebVitals,
	...nextTypescript,

	// Files tsconfig.json excludes have no type information, so type-aware rules cannot run on them.
	{
		files: [
			"scripts/**/*.{ts,tsx}",
			"tests/**/*.{ts,tsx}",
			"src/workers/**/*.ts",
			"src/app/(app)/(ai)/**/*.{ts,tsx}",
			"src/app/(app)/(demo)/examples/**/*.{ts,tsx}",
			"*.config.ts",
			"*.config.*.ts",
		],
		extends: [tseslint.configs.disableTypeChecked],
	},

	// TypeScript files configuration
	{
		files: ["**/*.{ts,tsx}"],
		ignores: [
			"scripts/**",
			"tests/**",
			"src/workers/**",
			"src/app/(app)/(ai)/**",
			"src/app/(app)/(demo)/examples/**",
			"*.config.ts",
			"*.config.*.ts",
		],
		extends: [tseslint.configs.recommendedTypeChecked, tseslint.configs.stylisticTypeChecked],
		languageOptions: {
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
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
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
			// ! Todo: Enable
			"@typescript-eslint/ban-ts-comment": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-misused-promises": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
		},
	}
);

export default eslintConfig;
