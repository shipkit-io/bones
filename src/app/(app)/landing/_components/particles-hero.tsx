"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Particles } from "@/components/ui/particles";
import { cn } from "@/lib/utils";

export function ParticlesHero({
	children,
	className,
	quantity = 100,
	speed = 80,
	color,
}: {
	children: React.ReactNode;
	className?: string;
	quantity?: number;
	speed?: number;
	color?: string;
}) {
	const { theme } = useTheme();
	const [currentColor, setCurrentColor] = useState("#ffffff");

	useEffect(() => {
		setCurrentColor(color ?? (theme === "dark" ? "#ffffff" : "#000000"));
	}, [color, theme]);

	return (
		<div
			className={cn("relative w-full bg-background", className)}
		>
			{children}
			<Particles
				className="absolute inset-0 [mask-image:linear-gradient(to_bottom_right,white,transparent)]"
				quantity={quantity}
				ease={speed}
				color={currentColor}
				refresh
			/>
		</div>
	);
}
