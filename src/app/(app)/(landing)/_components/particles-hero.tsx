"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Particles } from "@/components/ui/particles";
import { cn } from "@/lib/utils";

export function ParticlesHero({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const { theme } = useTheme();
	const [color, setColor] = useState("#ffffff");

	useEffect(() => {
		setColor(theme === "dark" ? "#ffffff" : "#000000");
	}, [theme]);

	return (
		<div
			className={cn("relative w-full overflow-hidden bg-background", className)}
		>
			{children}
			<Particles
				className="absolute inset-0 [mask-image:linear-gradient(to_bottom_right,white,transparent)]"
				quantity={100}
				ease={80}
				color={color}
				refresh
			/>
		</div>
	);
}
