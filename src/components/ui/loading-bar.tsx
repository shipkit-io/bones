"use client";

import { useEffect, useState } from "react";

export interface LoadingBarProps {
	/**
	 * The initial progress value (0-100)
	 * @default 0
	 */
	initialProgress?: number;
	/**
	 * Whether to show the loading bar
	 * @default true
	 */
	isVisible?: boolean;
	/**
	 * The color of the loading bar
	 * @default "bg-primary"
	 */
	className?: string;
}

export function LoadingBar({
	initialProgress = 0,
	isVisible = true,
	className = "bg-primary",
}: LoadingBarProps) {
	const [progress, setProgress] = useState(initialProgress);
	const [visible, setVisible] = useState(isVisible);

	useEffect(() => {
		// Simulate progress with a non-linear curve for more realistic feel
		const simulateProgress = () => {
			setProgress((current) => {
				if (current >= 100) {
					setTimeout(() => setVisible(false), 200); // Fade out after completion
					return 100;
				}

				// Non-linear progress simulation
				const remaining = 100 - current;
				const increment = Math.max(0.1, remaining * 0.1); // Slower as we progress
				return Math.min(current + increment, 100);
			});
		};

		const timer = setInterval(simulateProgress, 50);
		return () => clearInterval(timer);
	}, []);

	if (!visible) return null;

	return (
		<div className="fixed left-0 right-0 top-0 z-50 h-0.5 overflow-hidden bg-muted/20">
			<div
				className={`h-full transition-all duration-500 ease-out ${className}`}
				style={{
					width: `${progress}%`,
					boxShadow: "0 0 8px rgba(255, 255, 255, 0.5), 0 0 4px rgba(255, 255, 255, 0.3)",
				}}
			/>
		</div>
	);
}
