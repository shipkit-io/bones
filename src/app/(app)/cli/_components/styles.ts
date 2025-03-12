import { cva } from "class-variance-authority";

export const containerStyles = cva(
	"flex flex-col max-h-full w-full max-w-6xl mx-auto overflow-hidden text-base",
	{
		variants: {
			style: {
				brutalist:
					"border-2 border-primary rounded-none shadow-[8px_8px_0px_0px_hsl(var(--primary)/.3)]",
				modern: "border border-border rounded-lg shadow-md",
				minimalist: "",
			},
		},
		defaultVariants: {
			style: "modern",
		},
	},
);

export const headerStyles = cva("p-2 relative overflow-hidden", {
	variants: {
		style: {
			brutalist: "border-b-4 border-primary",
			modern: "",
			minimalist: "",
		},
	},
	defaultVariants: {
		style: "modern",
	},
});

export const buttonStyles = cva("transition-all", {
	variants: {
		style: {
			brutalist:
				"border-2 border-primary rounded-none hover:bg-primary hover:text-primary-foreground",
			modern:
				"border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
			minimalist:
				"border-none hover:bg-accent hover:text-accent-foreground transition-colors",
		},
	},
	defaultVariants: {
		style: "modern",
	},
});

export const componentCardStyles = cva("cursor-pointer transition-all", {
	variants: {
		style: {
			brutalist:
				"hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] border-2 border-primary rounded-none",
			modern:
				"hover:shadow-lg border border-border rounded-lg transition-shadow duration-300",
			minimalist: "hover:bg-accent border-b border-border",
		},
	},
	defaultVariants: {
		style: "modern",
	},
});
