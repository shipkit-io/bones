"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface LoaderLinesProps extends React.HTMLAttributes<HTMLDivElement> {
	fullscreen?: boolean;
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	speed?: "slow" | "normal" | "fast";
	colorScheme?: "vaporwave" | "rainbow" | "monochrome" | "brand" | "space";
	baseColor?: string;
	className?: string;
}

const sizeMap = {
	xs: { base: 30, height: 18 },
	sm: { base: 50, height: 30 },
	md: { base: 100, height: 60 },
	lg: { base: 150, height: 90 },
	xl: { base: 200, height: 120 },
};

const speedMap = {
	slow: 3000,
	normal: 2000,
	fast: 1000,
};

const colorSchemes = {
	vaporwave: [
		"#FF71CE", // Neon Pink
		"#01CDFE", // Cyan
		"#05FFA1", // Bright Green
		"#B967FF", // Purple
		"#FFFB96", // Light Yellow
	],
	space: [
		"#7400B8", // Deep Purple
		"#6930C3", // Royal Purple
		"#5E60CE", // Periwinkle
		"#5390D9", // Blue
		"#48BFE3", // Light Blue
	],
	rainbow: [
		"hsl(0, 80%, 60%)",
		"hsl(60, 80%, 60%)",
		"hsl(120, 80%, 60%)",
		"hsl(180, 80%, 60%)",
		"hsl(240, 80%, 60%)",
	],
	monochrome: (baseColor: string) => [
		`${baseColor}F0`,
		`${baseColor}CC`,
		`${baseColor}99`,
		`${baseColor}66`,
		`${baseColor}33`,
	],
	brand: [
		"var(--primary)",
		"var(--secondary)",
		"var(--accent)",
		"var(--muted)",
		"var(--primary)",
	],
};

export const LoaderLines = ({
	fullscreen = false,
	size = "md",
	speed = "normal",
	colorScheme = "monochrome",
	baseColor = "#ed00aa",
	className,
	...props
}: LoaderLinesProps) => {
	const { base, height } = sizeMap[size];
	const animationDuration = speedMap[speed];

	// Get colors based on color scheme
	const colors = React.useMemo(() => {
		if (colorScheme === "monochrome") {
			return colorSchemes.monochrome(baseColor);
		}
		return colorSchemes[colorScheme];
	}, [colorScheme, baseColor]);

	return (
		<div
			className={cn("loader", fullscreen && "loader-fullscreen", className)}
			style={
				{
					"--base": `${base}px`,
					"--height": `${height}px`,
					"--speed": `${animationDuration}ms`,
					"--color-1": colors[0],
					"--color-2": colors[1],
					"--color-3": colors[2],
					"--color-4": colors[3],
					"--color-5": colors[4],
				} as React.CSSProperties
			}
			{...props}
		>
			<div className="loader-inner">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="loader-line-wrap">
						<div className="loader-line" />
					</div>
				))}
			</div>

			<style jsx>{`
				.loader {
					position: relative;
					width: var(--base);
					height: var(--height);
				}

				.loader-fullscreen {
					background: #000;
					background: radial-gradient(#1a1a1a, #000);
					bottom: 0;
					left: 0;
					overflow: hidden;
					position: fixed;
					right: 0;
					top: 0;
					z-index: 99999;
				}

				.loader-inner {
					bottom: 0;
					height: var(--height);
					left: 0;
					margin: auto;
					position: absolute;
					right: 0;
					top: 0;
					width: var(--base);
				}

				.loader-line-wrap {
					animation: spin var(--speed) cubic-bezier(0.175, 0.885, 0.32, 1.275)
						infinite;
					box-sizing: border-box;
					height: calc(var(--base) * 0.5);
					left: 0;
					overflow: hidden;
					position: absolute;
					top: 0;
					transform-origin: 50% 100%;
					width: var(--base);
				}

				.loader-line {
					border: 4px solid transparent;
					border-radius: 100%;
					box-sizing: border-box;
					height: var(--base);
					left: 0;
					margin: 0 auto;
					position: absolute;
					right: 0;
					top: 0;
					width: var(--base);
				}

				.loader-line-wrap:nth-child(1) {
					animation-delay: calc(var(--speed) * -0.025);
				}
				.loader-line-wrap:nth-child(2) {
					animation-delay: calc(var(--speed) * -0.05);
				}
				.loader-line-wrap:nth-child(3) {
					animation-delay: calc(var(--speed) * -0.075);
				}
				.loader-line-wrap:nth-child(4) {
					animation-delay: calc(var(--speed) * -0.1);
				}
				.loader-line-wrap:nth-child(5) {
					animation-delay: calc(var(--speed) * -0.125);
				}

				.loader-line-wrap:nth-child(1) .loader-line {
					border-color: var(--color-1);
					height: calc(var(--base) * 0.9);
					width: calc(var(--base) * 0.9);
					top: calc(var(--base) * 0.07);
				}
				.loader-line-wrap:nth-child(2) .loader-line {
					border-color: var(--color-2);
					height: calc(var(--base) * 0.76);
					width: calc(var(--base) * 0.76);
					top: calc(var(--base) * 0.14);
				}
				.loader-line-wrap:nth-child(3) .loader-line {
					border-color: var(--color-3);
					height: calc(var(--base) * 0.62);
					width: calc(var(--base) * 0.62);
					top: calc(var(--base) * 0.21);
				}
				.loader-line-wrap:nth-child(4) .loader-line {
					border-color: var(--color-4);
					height: calc(var(--base) * 0.48);
					width: calc(var(--base) * 0.48);
					top: calc(var(--base) * 0.28);
				}
				.loader-line-wrap:nth-child(5) .loader-line {
					border-color: var(--color-5);
					height: calc(var(--base) * 0.34);
					width: calc(var(--base) * 0.34);
					top: calc(var(--base) * 0.35);
				}

				@keyframes spin {
					0%,
					15% {
						transform: rotate(0);
					}
					100% {
						transform: rotate(360deg);
					}
				}
			`}</style>
		</div>
	);
};
