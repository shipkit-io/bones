import { cn } from "@/lib/utils";

/**
 * Common button style configurations to reduce duplication across components
 */
export const buttonStyles = {
	/**
	 * Primary action button styles
	 */
	primaryAction: "bg-primary text-primary-foreground hover:bg-primary/90",

	/**
	 * Destructive action button styles
	 */
	destructiveAction: "bg-destructive text-destructive-foreground hover:bg-destructive/90",

	/**
	 * Icon button with text styles
	 */
	iconWithText: "flex items-center gap-2",

	/**
	 * Full width button
	 */
	fullWidth: "w-full",

	/**
	 * Compact button for tight spaces
	 */
	compact: "h-8 px-2 text-xs",

	/**
	 * Loading state styles
	 */
	loading: "opacity-75 cursor-not-allowed",
} as const;

/**
 * Common loading button configuration interface
 */
export interface LoadingButtonConfig {
	isLoading: boolean;
	loadingText?: string;
	defaultText: string;
	className?: string;
	disabled?: boolean;
}

/**
 * Creates configuration for a loading button to reduce duplication
 */
export const createLoadingButtonConfig = ({
	isLoading,
	loadingText = "Loading...",
	defaultText,
	className,
	disabled,
}: LoadingButtonConfig) => ({
	className: cn(className),
	disabled: disabled || isLoading,
	text: isLoading ? loadingText : defaultText,
	showSpinner: isLoading,
});

/**
 * Common async action button configurations
 */
export const asyncButtonConfigs = {
	/**
	 * Save button configuration
	 */
	save: (isLoading: boolean) =>
		createLoadingButtonConfig({
			isLoading,
			loadingText: "Saving...",
			defaultText: "Save",
		}),

	/**
	 * Delete button configuration
	 */
	delete: (isLoading: boolean) =>
		createLoadingButtonConfig({
			isLoading,
			loadingText: "Deleting...",
			defaultText: "Delete",
		}),

	/**
	 * Submit button configuration
	 */
	submit: (isLoading: boolean) =>
		createLoadingButtonConfig({
			isLoading,
			loadingText: "Submitting...",
			defaultText: "Submit",
		}),

	/**
	 * Import button configuration
	 */
	import: (isLoading: boolean, provider?: string) =>
		createLoadingButtonConfig({
			isLoading,
			loadingText: `Importing${provider ? ` ${provider}` : ""}...`,
			defaultText: "Import",
		}),
} as const;

/**
 * Utility to combine multiple button style classes
 */
export const combineButtonStyles = (...styles: (string | undefined)[]): string => {
	return cn(...styles.filter((style): style is string => Boolean(style)));
};
