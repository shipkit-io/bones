"use client";

import { motion, useAnimation } from "framer-motion";
import { Magnet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Btn03Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	particleCount?: number;
	attractRadius?: number;
}

interface Particle {
	id: number;
	x: number;
	y: number;
}

export function AttractButton({
	className,
	particleCount = 12,
	attractRadius = 50,
	...props
}: Btn03Props) {
	const [isAttracting, setIsAttracting] = useState(false);
	const [particles, setParticles] = useState<Particle[]>([]);
	const particlesControl = useAnimation();

	// Generate random particles
	useEffect(() => {
		const newParticles = Array.from({ length: particleCount }, (_, i) => ({
			id: i,
			x: Math.random() * 360 - 180,
			y: Math.random() * 360 - 180,
		}));
		setParticles(newParticles);
	}, [particleCount]);

	// Combined handler for both mouse and touch events
	const handleInteractionStart = useCallback(async () => {
		setIsAttracting(true);
		await particlesControl.start({
			x: 0,
			y: 0,
			transition: {
				type: "spring",
				stiffness: 50,
				damping: 10,
			},
		});
	}, [particlesControl]);

	const handleInteractionEnd = useCallback(async () => {
		setIsAttracting(false);
		await particlesControl.start((i) => ({
			x: particles[i]?.x || 0,
			y: particles[i]?.y || 0,
			transition: {
				type: "spring",
				stiffness: 100,
				damping: 15,
			},
		}));
	}, [particlesControl, particles]);

	return (
		<Button
			className={cn(
				"relative min-w-40 touch-none",
				"bg-violet-100 dark:bg-violet-900",
				"hover:bg-violet-200 dark:hover:bg-violet-800",
				"text-violet-600 dark:text-violet-300",
				"border border-violet-300 dark:border-violet-700",
				"transition-all duration-300",
				className
			)}
			onMouseEnter={handleInteractionStart}
			onMouseLeave={handleInteractionEnd}
			onTouchStart={handleInteractionStart}
			onTouchEnd={handleInteractionEnd}
			{...props}
		>
			{particles.map((_, index) => (
				<motion.div
					key={index}
					custom={index}
					initial={{ x: particles[index]?.x || 0, y: particles[index]?.y || 0 }}
					animate={particlesControl}
					className={cn(
						"absolute h-1.5 w-1.5 rounded-full",
						"bg-violet-400 dark:bg-violet-300",
						"transition-opacity duration-300",
						isAttracting ? "opacity-100" : "opacity-40"
					)}
				/>
			))}
			<span className="relative flex w-full items-center justify-center gap-2">
				<Magnet
					className={cn("h-4 w-4 transition-transform duration-300", isAttracting && "scale-110")}
				/>
				{isAttracting ? "Attracting" : "Hover me"}
			</span>
		</Button>
	);
}
