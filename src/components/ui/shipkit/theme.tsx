/**
 * @description A theme provider and theme toggle components for light/dark mode
 * @category Theme
 * @status stable
 * @version 2.0.0
 *
 * @example
 * <ThemeProvider>
 *   <ThemeToggle />
 *   // or
 *   <ThemeChooser />
 *   // or with animations
 *   <ThemeToggleAnimated variant="yin-yang" />
 * </ThemeProvider>
 *
 * @props {object} ThemeProvider.props
 * - attribute="class" - HTML attribute to apply theme
 * - defaultTheme="system" - Default theme
 * - enableSystem=true - Enable system theme detection
 * - disableTransitionOnChange=false - Disable transitions when changing theme
 *
 * @props {object} ThemeToggle.props
 * - variant="ghost" - Button variant
 * - size="icon" - Button size
 *
 * @props {object} ThemeChooser.props
 * - variant="ghost" - Button variant
 * - size="icon" - Button size
 *
 * @see https://ui.shadcn.com/docs/dark-mode
 * @see https://github.com/pacocoursey/next-themes
 */

"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import React, { useCallback, useEffect, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { env } from "@/env";
import { cn } from "@/lib/utils";

// ///////////////////////////////////////////////////////////////////////////
// Types
// ///////////////////////////////////////////////////////////////////////////

export type AnimationVariant =
	| "circle"
	| "rectangle"
	| "gif"
	| "polygon"
	| "circle-blur";

export type AnimationStart =
	| "top-left"
	| "top-right"
	| "bottom-left"
	| "bottom-right"
	| "center"
	| "top-center"
	| "bottom-center"
	| "bottom-up"
	| "top-down"
	| "left-right"
	| "right-left";

export type ThemeToggleVariant =
	| "default"
	| "yin-yang"
	| "sun-moon"
	| "sun-dots"
	| "lightbulb"
	| "eclipse";

interface Animation {
	name: string;
	css: string;
}

type Theme = "light" | "dark" | "system";

interface UseThemeToggleOptions {
	variant?: AnimationVariant;
	start?: AnimationStart;
	blur?: boolean;
	gifUrl?: string;
	/** Optional callback invoked after any theme change. Useful for persisting theme preference. */
	onThemeChange?: (theme: Theme) => void | Promise<void>;
}

// ///////////////////////////////////////////////////////////////////////////
// Animation Utilities (must be defined before useThemeToggle hook)
// ///////////////////////////////////////////////////////////////////////////

function getPositionCoords(position: AnimationStart) {
	switch (position) {
		case "top-left":
			return { cx: "0", cy: "0" };
		case "top-right":
			return { cx: "40", cy: "0" };
		case "bottom-left":
			return { cx: "0", cy: "40" };
		case "bottom-right":
			return { cx: "40", cy: "40" };
		case "top-center":
			return { cx: "20", cy: "0" };
		case "bottom-center":
			return { cx: "20", cy: "40" };
		// For directional positions, default to center (these are used for rectangle variant)
		case "bottom-up":
		case "top-down":
		case "left-right":
		case "right-left":
		case "center":
			return { cx: "20", cy: "20" };
	}
}

function generateSVG(variant: AnimationVariant, start: AnimationStart) {
	// circle-blur variant handles center case differently, so check it first
	if (variant === "circle-blur") {
		if (start === "center") {
			return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="20" cy="20" r="18" fill="white" filter="url(%23blur)"/></svg>`;
		}
		const positionCoords = getPositionCoords(start);
		if (!positionCoords) {
			throw new Error(`Invalid start position: ${start}`);
		}
		const { cx, cy } = positionCoords;
		return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="${cx}" cy="${cy}" r="18" fill="white" filter="url(%23blur)"/></svg>`;
	}

	if (start === "center") return;

	// Rectangle variant doesn't use SVG masks, so return early
	if (variant === "rectangle") return "";

	const positionCoords = getPositionCoords(start);
	if (!positionCoords) {
		throw new Error(`Invalid start position: ${start}`);
	}
	const { cx, cy } = positionCoords;

	if (variant === "circle") {
		return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="${cx}" cy="${cy}" r="20" fill="white"/></svg>`;
	}

	return "";
}

function getTransformOrigin(start: AnimationStart) {
	switch (start) {
		case "top-left":
			return "top left";
		case "top-right":
			return "top right";
		case "bottom-left":
			return "bottom left";
		case "bottom-right":
			return "bottom right";
		case "top-center":
			return "top center";
		case "bottom-center":
			return "bottom center";
		// For directional positions, default to center
		case "bottom-up":
		case "top-down":
		case "left-right":
		case "right-left":
		case "center":
			return "center";
	}
}

export function createAnimation(
	variant: AnimationVariant,
	start: AnimationStart = "center",
	blur = false,
	url?: string,
): Animation {
	const svg = generateSVG(variant, start);
	const transformOrigin = getTransformOrigin(start);

	if (variant === "rectangle") {
		const getClipPath = (direction: AnimationStart) => {
			switch (direction) {
				case "bottom-up":
					return {
						from: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
						to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					};
				case "top-down":
					return {
						from: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
						to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					};
				case "left-right":
					return {
						from: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
						to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					};
				case "right-left":
					return {
						from: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
						to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					};
				case "top-left":
					return {
						from: "polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)",
						to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					};
				case "top-right":
					return {
						from: "polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)",
						to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					};
				case "bottom-left":
					return {
						from: "polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)",
						to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					};
				case "bottom-right":
					return {
						from: "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)",
						to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					};
				default:
					return {
						from: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
						to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					};
			}
		};

		const clipPath = getClipPath(start);

		return {
			name: `${variant}-${start}${blur ? "-blur" : ""}`,
			css: `
       ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: var(--expo-out);
      }

      ::view-transition-new(root) {
        animation-name: reveal-light-${start}${blur ? "-blur" : ""};
        ${blur ? "filter: blur(2px);" : ""}
      }

      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal-dark-${start}${blur ? "-blur" : ""};
        ${blur ? "filter: blur(2px);" : ""}
      }

      @keyframes reveal-dark-${start}${blur ? "-blur" : ""} {
        from {
          clip-path: ${clipPath.from};
          ${blur ? "filter: blur(8px);" : ""}
        }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to {
          clip-path: ${clipPath.to};
          ${blur ? "filter: blur(0px);" : ""}
        }
      }

      @keyframes reveal-light-${start}${blur ? "-blur" : ""} {
        from {
          clip-path: ${clipPath.from};
          ${blur ? "filter: blur(8px);" : ""}
        }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to {
          clip-path: ${clipPath.to};
          ${blur ? "filter: blur(0px);" : ""}
        }
      }
      `,
		};
	}

	if (variant === "circle" && start === "center") {
		return {
			name: `${variant}-${start}${blur ? "-blur" : ""}`,
			css: `
       ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: var(--expo-out);
      }

      ::view-transition-new(root) {
        animation-name: reveal-light${blur ? "-blur" : ""};
        ${blur ? "filter: blur(2px);" : ""}
      }

      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal-dark${blur ? "-blur" : ""};
        ${blur ? "filter: blur(2px);" : ""}
      }

      @keyframes reveal-dark${blur ? "-blur" : ""} {
        from {
          clip-path: circle(0% at 50% 50%);
          ${blur ? "filter: blur(8px);" : ""}
        }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to {
          clip-path: circle(100.0% at 50% 50%);
          ${blur ? "filter: blur(0px);" : ""}
        }
      }

      @keyframes reveal-light${blur ? "-blur" : ""} {
        from {
           clip-path: circle(0% at 50% 50%);
           ${blur ? "filter: blur(8px);" : ""}
        }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to {
          clip-path: circle(100.0% at 50% 50%);
          ${blur ? "filter: blur(0px);" : ""}
        }
      }
      `,
		};
	}

	if (variant === "gif") {
		return {
			name: `${variant}-${start}`,
			css: `
      ::view-transition-group(root) {
  animation-timing-function: var(--expo-in);
}

::view-transition-new(root) {
  mask: url('${url}') center / 0 no-repeat;
  animation: scale 3s;
}

::view-transition-old(root),
.dark::view-transition-old(root) {
  animation: scale 3s;
}

@keyframes scale {
  0% {
    mask-size: 0;
  }
  10% {
    mask-size: 50vmax;
  }
  90% {
    mask-size: 50vmax;
  }
  100% {
    mask-size: 2000vmax;
  }
}`,
		};
	}

	if (variant === "circle-blur") {
		if (start === "center") {
			return {
				name: `${variant}-${start}`,
				css: `
        ::view-transition-group(root) {
          animation-timing-function: var(--expo-out);
        }

        ::view-transition-new(root) {
          mask: url('${svg}') center / 0 no-repeat;
          mask-origin: content-box;
          animation: scale 1s;
          transform-origin: center;
        }

        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: scale 1s;
          transform-origin: center;
          z-index: -1;
        }

        @keyframes scale {
          to {
            mask-size: 350vmax;
          }
        }
        `,
			};
		}

		return {
			name: `${variant}-${start}`,
			css: `
      ::view-transition-group(root) {
        animation-timing-function: var(--expo-out);
      }

      ::view-transition-new(root) {
        mask: url('${svg}') ${start.replace("-", " ")} / 0 no-repeat;
        mask-origin: content-box;
        animation: scale 1s;
        transform-origin: ${transformOrigin};
      }

      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: scale 1s;
        transform-origin: ${transformOrigin};
        z-index: -1;
      }

      @keyframes scale {
        to {
          mask-size: 350vmax;
        }
      }
      `,
		};
	}

	if (variant === "polygon") {
		const getPolygonClipPaths = (position: AnimationStart) => {
			switch (position) {
				case "top-left":
					return {
						darkFrom: "polygon(50% -71%, -50% 71%, -50% 71%, 50% -71%)",
						darkTo: "polygon(50% -71%, -50% 71%, 50% 171%, 171% 50%)",
						lightFrom: "polygon(171% 50%, 50% 171%, 50% 171%, 171% 50%)",
						lightTo: "polygon(171% 50%, 50% 171%, -50% 71%, 50% -71%)",
					};
				case "top-right":
					return {
						darkFrom: "polygon(150% -71%, 250% 71%, 250% 71%, 150% -71%)",
						darkTo: "polygon(150% -71%, 250% 71%, 50% 171%, -71% 50%)",
						lightFrom: "polygon(-71% 50%, 50% 171%, 50% 171%, -71% 50%)",
						lightTo: "polygon(-71% 50%, 50% 171%, 250% 71%, 150% -71%)",
					};
				default:
					// Default to top-left behavior
					return {
						darkFrom: "polygon(50% -71%, -50% 71%, -50% 71%, 50% -71%)",
						darkTo: "polygon(50% -71%, -50% 71%, 50% 171%, 171% 50%)",
						lightFrom: "polygon(171% 50%, 50% 171%, 50% 171%, 171% 50%)",
						lightTo: "polygon(171% 50%, 50% 171%, -50% 71%, 50% -71%)",
					};
			}
		};

		const clipPaths = getPolygonClipPaths(start);

		return {
			name: `${variant}-${start}${blur ? "-blur" : ""}`,
			css: `
      ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: var(--expo-out);
      }

      ::view-transition-new(root) {
        animation-name: reveal-light-${start}${blur ? "-blur" : ""};
        ${blur ? "filter: blur(2px);" : ""}
      }

      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal-dark-${start}${blur ? "-blur" : ""};
        ${blur ? "filter: blur(2px);" : ""}
      }

      @keyframes reveal-dark-${start}${blur ? "-blur" : ""} {
        from {
          clip-path: ${clipPaths.darkFrom};
          ${blur ? "filter: blur(8px);" : ""}
        }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to {
          clip-path: ${clipPaths.darkTo};
          ${blur ? "filter: blur(0px);" : ""}
        }
      }

      @keyframes reveal-light-${start}${blur ? "-blur" : ""} {
        from {
          clip-path: ${clipPaths.lightFrom};
          ${blur ? "filter: blur(8px);" : ""}
        }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to {
          clip-path: ${clipPaths.lightTo};
          ${blur ? "filter: blur(0px);" : ""}
        }
      }
      `,
		};
	}

	// Handle circle variants with start positions using clip-path
	if (variant === "circle" && start !== "center") {
		const getClipPathPosition = (position: AnimationStart) => {
			switch (position) {
				case "top-left":
					return "0% 0%";
				case "top-right":
					return "100% 0%";
				case "bottom-left":
					return "0% 100%";
				case "bottom-right":
					return "100% 100%";
				case "top-center":
					return "50% 0%";
				case "bottom-center":
					return "50% 100%";
				default:
					return "50% 50%";
			}
		};

		const clipPosition = getClipPathPosition(start);

		return {
			name: `${variant}-${start}${blur ? "-blur" : ""}`,
			css: `
       ::view-transition-group(root) {
        animation-duration: 1s;
        animation-timing-function: var(--expo-out);
      }

      ::view-transition-new(root) {
        animation-name: reveal-light-${start}${blur ? "-blur" : ""};
        ${blur ? "filter: blur(2px);" : ""}
      }

      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal-dark-${start}${blur ? "-blur" : ""};
        ${blur ? "filter: blur(2px);" : ""}
      }

      @keyframes reveal-dark-${start}${blur ? "-blur" : ""} {
        from {
          clip-path: circle(0% at ${clipPosition});
          ${blur ? "filter: blur(8px);" : ""}
        }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to {
          clip-path: circle(150.0% at ${clipPosition});
          ${blur ? "filter: blur(0px);" : ""}
        }
      }

      @keyframes reveal-light-${start}${blur ? "-blur" : ""} {
        from {
           clip-path: circle(0% at ${clipPosition});
           ${blur ? "filter: blur(8px);" : ""}
        }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to {
          clip-path: circle(150.0% at ${clipPosition});
          ${blur ? "filter: blur(0px);" : ""}
        }
      }
      `,
		};
	}

	return {
		name: `${variant}-${start}${blur ? "-blur" : ""}`,
		css: `
      ::view-transition-group(root) {
        animation-timing-function: var(--expo-in);
      }
      ::view-transition-new(root) {
        mask: url('${svg}') ${start.replace("-", " ")} / 0 no-repeat;
        mask-origin: content-box;
        animation: scale-${start}${blur ? "-blur" : ""} 1s;
        transform-origin: ${transformOrigin};
        ${blur ? "filter: blur(2px);" : ""}
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: scale-${start}${blur ? "-blur" : ""} 1s;
        transform-origin: ${transformOrigin};
        z-index: -1;
      }
      @keyframes scale-${start}${blur ? "-blur" : ""} {
        from {
          ${blur ? "filter: blur(8px);" : ""}
        }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to {
          mask-size: 2000vmax;
          ${blur ? "filter: blur(0px);" : ""}
        }
      }
    `,
	};
}

// ///////////////////////////////////////////////////////////////////////////
// useThemeToggle Hook - View Transitions API based theme switching
// ///////////////////////////////////////////////////////////////////////////

export const useThemeToggle = ({
	variant = "circle",
	start = "center",
	blur = false,
	gifUrl = "",
	onThemeChange,
}: UseThemeToggleOptions = {}) => {
	const { theme, setTheme, resolvedTheme } = useTheme();

	const lightEnabled = !!env.NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED;
	const darkEnabled = !!env.NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED;
	const canToggle = lightEnabled && darkEnabled;

	const [isDark, setIsDark] = useState(false);

	// Sync isDark state with resolved theme after hydration
	useEffect(() => {
		setIsDark(resolvedTheme === "dark");
	}, [resolvedTheme]);

	const styleId = "theme-transition-styles";

	const updateStyles = useCallback((css: string) => {
		if (typeof window === "undefined") return;

		let styleElement = document.getElementById(styleId) as HTMLStyleElement;

		if (!styleElement) {
			styleElement = document.createElement("style");
			styleElement.id = styleId;
			document.head.appendChild(styleElement);
		}

		styleElement.textContent = css;
	}, []);

	const toggleTheme = useCallback(() => {
		if (!canToggle) return;

		setIsDark((prev) => !prev);

		const animation = createAnimation(variant, start, blur, gifUrl);
		updateStyles(animation.css);

		if (typeof window === "undefined") return;

		const newTheme: Theme = resolvedTheme === "light" ? "dark" : "light";

		// Use resolvedTheme instead of theme to handle 'system' correctly
		const switchTheme = () => {
			setTheme(newTheme);
			void onThemeChange?.(newTheme);
		};

		if (!document.startViewTransition) {
			switchTheme();
			return;
		}

		document.startViewTransition(switchTheme);
	}, [
		resolvedTheme,
		setTheme,
		variant,
		start,
		blur,
		gifUrl,
		updateStyles,
		canToggle,
		onThemeChange,
	]);

	const setLightTheme = useCallback(() => {
		if (!lightEnabled) return;

		setIsDark(false);

		const animation = createAnimation(variant, start, blur, gifUrl);
		updateStyles(animation.css);

		if (typeof window === "undefined") return;

		const switchTheme = () => {
			setTheme("light");
			void onThemeChange?.("light");
		};

		if (!document.startViewTransition) {
			switchTheme();
			return;
		}

		document.startViewTransition(switchTheme);
	}, [setTheme, variant, start, blur, gifUrl, updateStyles, lightEnabled, onThemeChange]);

	const setDarkTheme = useCallback(() => {
		if (!darkEnabled) return;

		setIsDark(true);

		const animation = createAnimation(variant, start, blur, gifUrl);
		updateStyles(animation.css);

		if (typeof window === "undefined") return;

		const switchTheme = () => {
			setTheme("dark");
			void onThemeChange?.("dark");
		};

		if (!document.startViewTransition) {
			switchTheme();
			return;
		}

		document.startViewTransition(switchTheme);
	}, [setTheme, variant, start, blur, gifUrl, updateStyles, darkEnabled, onThemeChange]);

	const setSystemTheme = useCallback(() => {
		if (!canToggle) return;

		if (typeof window === "undefined") return;

		// Check system preference for dark mode
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		setIsDark(prefersDark);

		const animation = createAnimation(variant, start, blur, gifUrl);
		updateStyles(animation.css);

		const switchTheme = () => {
			setTheme("system");
			void onThemeChange?.("system");
		};

		if (!document.startViewTransition) {
			switchTheme();
			return;
		}

		document.startViewTransition(switchTheme);
	}, [setTheme, variant, start, blur, gifUrl, updateStyles, canToggle, onThemeChange]);

	return {
		theme,
		resolvedTheme,
		isDark,
		canToggle,
		lightEnabled,
		darkEnabled,
		toggleTheme,
		setLightTheme,
		setDarkTheme,
		setSystemTheme,
		setTheme,
	};
};

// ///////////////////////////////////////////////////////////////////////////
// Theme Button Components
// ///////////////////////////////////////////////////////////////////////////

const ThemeButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(props, ref) => (
		<Button variant="ghost" size="icon" {...props} ref={ref}>
			<SunIcon className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<MoonIcon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	),
);
ThemeButton.displayName = "ThemeButton";

const ThemeToggle = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(props, ref) => {
		const { toggleTheme, canToggle } = useThemeToggle();

		return (
			<ThemeButton
				onClick={toggleTheme}
				disabled={!canToggle}
				{...props}
				ref={ref}
			/>
		);
	},
);
ThemeToggle.displayName = "ThemeToggle";

const ThemeChooser = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(props, ref) => {
		const {
			setLightTheme,
			setDarkTheme,
			setSystemTheme,
			lightEnabled,
			darkEnabled,
			canToggle,
		} = useThemeToggle();

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<ThemeButton {...props} ref={ref} />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{lightEnabled && (
						<DropdownMenuItem onClick={setLightTheme}>Light</DropdownMenuItem>
					)}
					{darkEnabled && (
						<DropdownMenuItem onClick={setDarkTheme}>Dark</DropdownMenuItem>
					)}
					{canToggle && (
						<DropdownMenuItem onClick={setSystemTheme}>System</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	},
);
ThemeChooser.displayName = "ThemeChooser";

// ///////////////////////////////////////////////////////////////////////////
// Animated Theme Toggle Buttons (from Skiper UI)
// ///////////////////////////////////////////////////////////////////////////

interface ThemeToggleAnimatedProps {
	className?: string;
	variant?: ThemeToggleVariant;
	animationVariant?: AnimationVariant;
	animationStart?: AnimationStart;
	blur?: boolean;
}

export const ThemeToggleAnimated = ({
	className = "",
	variant = "yin-yang",
	animationVariant = "circle",
	animationStart = "center",
	blur = false,
}: ThemeToggleAnimatedProps) => {
	const { isDark, toggleTheme, canToggle } = useThemeToggle({
		variant: animationVariant,
		start: animationStart,
		blur,
	});

	switch (variant) {
		case "yin-yang":
			return (
				<ThemeToggleYinYang
					className={className}
					isDark={isDark}
					onToggle={toggleTheme}
					disabled={!canToggle}
				/>
			);
		case "sun-moon":
			return (
				<ThemeToggleSunMoon
					className={className}
					isDark={isDark}
					onToggle={toggleTheme}
					disabled={!canToggle}
				/>
			);
		case "sun-dots":
			return (
				<ThemeToggleSunDots
					className={className}
					isDark={isDark}
					onToggle={toggleTheme}
					disabled={!canToggle}
				/>
			);
		case "lightbulb":
			return (
				<ThemeToggleLightbulb
					className={className}
					isDark={isDark}
					onToggle={toggleTheme}
					disabled={!canToggle}
				/>
			);
		case "eclipse":
			return (
				<ThemeToggleEclipse
					className={className}
					isDark={isDark}
					onToggle={toggleTheme}
					disabled={!canToggle}
				/>
			);
		default:
			return (
				<ThemeToggleYinYang
					className={className}
					isDark={isDark}
					onToggle={toggleTheme}
					disabled={!canToggle}
				/>
			);
	}
};

interface AnimatedButtonProps {
	className?: string;
	isDark: boolean;
	onToggle: () => void;
	disabled?: boolean;
}

// Yin-Yang style toggle button
const ThemeToggleYinYang = ({
	className,
	isDark,
	onToggle,
	disabled,
}: AnimatedButtonProps) => {
	return (
		<button
			type="button"
			className={cn(
				"size-10 cursor-pointer rounded-full bg-black p-0 transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			onClick={onToggle}
			disabled={disabled}
			aria-label="Toggle theme"
		>
			<span className="sr-only">Toggle theme</span>
			<svg
				viewBox="0 0 240 240"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<motion.g
					animate={{ rotate: isDark ? -180 : 0 }}
					transition={{ ease: "easeInOut", duration: 0.5 }}
				>
					<path
						d="M120 67.5C149.25 67.5 172.5 90.75 172.5 120C172.5 149.25 149.25 172.5 120 172.5"
						fill="white"
					/>
					<path
						d="M120 67.5C90.75 67.5 67.5 90.75 67.5 120C67.5 149.25 90.75 172.5 120 172.5"
						fill="black"
					/>
				</motion.g>
				<motion.path
					animate={{ rotate: isDark ? 180 : 0 }}
					transition={{ ease: "easeInOut", duration: 0.5 }}
					d="M120 3.75C55.5 3.75 3.75 55.5 3.75 120C3.75 184.5 55.5 236.25 120 236.25C184.5 236.25 236.25 184.5 236.25 120C236.25 55.5 184.5 3.75 120 3.75ZM120 214.5V172.5C90.75 172.5 67.5 149.25 67.5 120C67.5 90.75 90.75 67.5 120 67.5V25.5C172.5 25.5 214.5 67.5 214.5 120C214.5 172.5 172.5 214.5 120 214.5Z"
					fill="white"
				/>
			</svg>
		</button>
	);
};

// Sun/Moon toggle with rays
const ThemeToggleSunMoon = ({
	className,
	isDark,
	onToggle,
	disabled,
}: AnimatedButtonProps) => {
	return (
		<button
			type="button"
			className={cn(
				"size-10 rounded-full p-2 transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
				isDark ? "bg-black text-white" : "bg-white text-black",
				className,
			)}
			onClick={onToggle}
			disabled={disabled}
			aria-label="Toggle theme"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				fill="currentColor"
				strokeLinecap="round"
				viewBox="0 0 32 32"
			>
				<clipPath id="theme-toggle-sun-moon">
					<motion.path
						animate={{ y: isDark ? 10 : 0, x: isDark ? -12 : 0 }}
						transition={{ ease: "easeInOut", duration: 0.35 }}
						d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
					/>
				</clipPath>
				<g clipPath="url(#theme-toggle-sun-moon)">
					<motion.circle
						animate={{ r: isDark ? 10 : 8 }}
						transition={{ ease: "easeInOut", duration: 0.35 }}
						cx="16"
						cy="16"
					/>
					<motion.g
						animate={{
							rotate: isDark ? -100 : 0,
							scale: isDark ? 0.5 : 1,
							opacity: isDark ? 0 : 1,
						}}
						transition={{ ease: "easeInOut", duration: 0.35 }}
						stroke="currentColor"
						strokeWidth="1.5"
					>
						<path d="M16 5.5v-4" />
						<path d="M16 30.5v-4" />
						<path d="M1.5 16h4" />
						<path d="M26.5 16h4" />
						<path d="m23.4 8.6 2.8-2.8" />
						<path d="m5.7 26.3 2.9-2.9" />
						<path d="m5.8 5.8 2.8 2.8" />
						<path d="m23.4 23.4 2.9 2.9" />
					</motion.g>
				</g>
			</svg>
		</button>
	);
};

// Sun with dots instead of rays
const ThemeToggleSunDots = ({
	className,
	isDark,
	onToggle,
	disabled,
}: AnimatedButtonProps) => {
	return (
		<button
			type="button"
			className={cn(
				"size-10 rounded-full p-2 transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
				isDark ? "bg-black text-white" : "bg-white text-black",
				className,
			)}
			onClick={onToggle}
			disabled={disabled}
			aria-label="Toggle theme"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				fill="currentColor"
				strokeLinecap="round"
				viewBox="0 0 32 32"
			>
				<clipPath id="theme-toggle-sun-dots">
					<motion.path
						animate={{ y: isDark ? 14 : 0, x: isDark ? -11 : 0 }}
						transition={{ ease: "easeInOut", duration: 0.35 }}
						d="M0-11h25a1 1 0 0017 13v30H0Z"
					/>
				</clipPath>
				<g clipPath="url(#theme-toggle-sun-dots)">
					<motion.circle
						animate={{ r: isDark ? 10 : 8 }}
						transition={{ ease: "easeInOut", duration: 0.35 }}
						cx="16"
						cy="16"
					/>
					<motion.g
						animate={{
							scale: isDark ? 0.5 : 1,
							opacity: isDark ? 0 : 1,
						}}
						transition={{ ease: "easeInOut", duration: 0.35 }}
						stroke="currentColor"
						strokeWidth="1.5"
					>
						<path d="M18.3 3.2c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3S14.7.9 16 .9s2.3 1 2.3 2.3zm-4.6 25.6c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3zm15.1-10.5c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zM3.2 13.7c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3S.9 17.3.9 16s1-2.3 2.3-2.3zm5.8-7C9 7.9 7.9 9 6.7 9S4.4 8 4.4 6.7s1-2.3 2.3-2.3S9 5.4 9 6.7zm16.3 21c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zm2.4-21c0 1.3-1 2.3-2.3 2.3S23 7.9 23 6.7s1-2.3 2.3-2.3 2.4 1 2.4 2.3zM6.7 23C8 23 9 24 9 25.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3z" />
					</motion.g>
				</g>
			</svg>
		</button>
	);
};

// Lightbulb toggle
const ThemeToggleLightbulb = ({
	className,
	isDark,
	onToggle,
	disabled,
}: AnimatedButtonProps) => {
	return (
		<button
			type="button"
			className={cn(
				"size-10 rounded-full p-2 transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
				isDark ? "bg-black text-white" : "bg-white text-black",
				className,
			)}
			onClick={onToggle}
			disabled={disabled}
			aria-label="Toggle theme"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				strokeWidth="0.7"
				stroke="currentColor"
				fill="currentColor"
				strokeLinecap="round"
				viewBox="0 0 32 32"
			>
				<path
					strokeWidth="0"
					d="M9.4 9.9c1.8-1.8 4.1-2.7 6.6-2.7 5.1 0 9.3 4.2 9.3 9.3 0 2.3-.8 4.4-2.3 6.1-.7.8-2 2.8-2.5 4.4 0 .2-.2.4-.5.4-.2 0-.4-.2-.4-.5v-.1c.5-1.8 2-3.9 2.7-4.8 1.4-1.5 2.1-3.5 2.1-5.6 0-4.7-3.7-8.5-8.4-8.5-2.3 0-4.4.9-5.9 2.5-1.6 1.6-2.5 3.7-2.5 6 0 2.1.7 4 2.1 5.6.8.9 2.2 2.9 2.7 4.9 0 .2-.1.5-.4.5h-.1c-.2 0-.4-.1-.4-.4-.5-1.7-1.8-3.7-2.5-4.5-1.5-1.7-2.3-3.9-2.3-6.1 0-2.3 1-4.7 2.7-6.5z"
				/>
				<path d="M19.8 28.3h-7.6" />
				<path d="M19.8 29.5h-7.6" />
				<path d="M19.8 30.7h-7.6" />
				<motion.path
					animate={{
						pathLength: isDark ? 0 : 1,
						opacity: isDark ? 0 : 1,
					}}
					transition={{ ease: "easeInOut", duration: 0.35 }}
					pathLength="1"
					fill="none"
					d="M14.6 27.1c0-3.4 0-6.8-.1-10.2-.2-1-1.1-1.7-2-1.7-1.2-.1-2.3 1-2.2 2.3.1 1 .9 1.9 2.1 2h7.2c1.1-.1 2-1 2.1-2 .1-1.2-1-2.3-2.2-2.3-.9 0-1.7.7-2 1.7 0 3.4 0 6.8-.1 10.2"
				/>
				<motion.g
					animate={{
						scale: isDark ? 0.5 : 1,
						opacity: isDark ? 0 : 1,
					}}
					transition={{ ease: "easeInOut", duration: 0.35 }}
				>
					<path pathLength="1" d="M16 6.4V1.3" />
					<path pathLength="1" d="M26.3 15.8h5.1" />
					<path pathLength="1" d="m22.6 9 3.7-3.6" />
					<path pathLength="1" d="M9.4 9 5.7 5.4" />
					<path pathLength="1" d="M5.7 15.8H.6" />
				</motion.g>
			</svg>
		</button>
	);
};

// Eclipse style toggle
const ThemeToggleEclipse = ({
	className,
	isDark,
	onToggle,
	disabled,
}: AnimatedButtonProps) => {
	return (
		<button
			type="button"
			className={cn(
				"size-10 rounded-full p-3 transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
				isDark ? "bg-black text-white" : "bg-white text-black",
				className,
			)}
			onClick={onToggle}
			disabled={disabled}
			aria-label="Toggle theme"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				fill="currentColor"
				viewBox="0 0 32 32"
			>
				<clipPath id="theme-toggle-eclipse">
					<motion.path
						animate={{ y: isDark ? 5 : 0, x: isDark ? -20 : 0 }}
						transition={{ ease: "easeInOut", duration: 0.35 }}
						d="M0-5h55v37h-55zm32 12a1 1 0 0025 0 1 1 0 00-25 0"
					/>
				</clipPath>
				<g clipPath="url(#theme-toggle-eclipse)">
					<circle cx="16" cy="16" r="15" />
				</g>
			</svg>
		</button>
	);
};

// ///////////////////////////////////////////////////////////////////////////
// Theme Provider
// ///////////////////////////////////////////////////////////////////////////

// Wrapper ThemeProvider that enforces allowed themes based on build-time flags
// while preserving a compatible interface with next-themes' ThemeProvider
const ThemeProvider = ({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) => {
	const lightEnabled = !!env.NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED;
	const darkEnabled = !!env.NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED;
	const bothEnabled = lightEnabled && darkEnabled;
	const computedThemes = [
		lightEnabled && "light",
		darkEnabled && "dark",
	].filter(Boolean) as string[];
	const themes = computedThemes.length ? computedThemes : ["light"];
	const defaultTheme = bothEnabled ? "system" : lightEnabled ? "light" : "dark";
	const forcedTheme = bothEnabled ? undefined : lightEnabled ? "light" : "dark";

	return (
		<NextThemesProvider
			attribute="class"
			enableSystem={bothEnabled}
			forcedTheme={forcedTheme}
			defaultTheme={defaultTheme}
			themes={themes}
			disableTransitionOnChange
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
};

// ///////////////////////////////////////////////////////////////////////////
// Exports
// ///////////////////////////////////////////////////////////////////////////

export {
	ThemeChooser,
	ThemeProvider,
	ThemeToggle,
	ThemeButton,
	ThemeToggleYinYang,
	ThemeToggleSunMoon,
	ThemeToggleSunDots,
	ThemeToggleLightbulb,
	ThemeToggleEclipse,
};

export type { Theme };
