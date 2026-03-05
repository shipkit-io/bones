"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnhancedTextProps {
	text?: string;
	className?: string;
	shadowColors?: {
		first?: string;
		second?: string;
		third?: string;
		fourth?: string;
		glow?: string;
	};
}

export function EnhancedText({
	text = "LINE",
	className = "",
	shadowColors = {
		first: "#07bccc",
		second: "#e601c0",
		third: "#e9019a",
		fourth: "#f40468",
		glow: "#f40468",
	},
}: EnhancedTextProps) {
	// Create two style states - with and without shadow
	const textShadowStyle = {
		textShadow: `10px 10px 0px ${shadowColors.first}, 
                     15px 15px 0px ${shadowColors.second}, 
                     20px 20px 0px ${shadowColors.third}, 
                     25px 25px 0px ${shadowColors.fourth}, 
                     45px 45px 10px ${shadowColors.glow}`,
	};

	const noShadowStyle = {
		textShadow: "none",
	};

	return (
		<div className="w-full text-center">
			<motion.div
				className={cn(
					"w-full cursor-pointer text-center text-3xl font-bold",
					"tracking-widest transition-all duration-200 ease-in-out",
					"italic text-black dark:text-white",
					"stroke-[#d6f4f4]",
					className
				)}
				style={textShadowStyle}
				whileHover={noShadowStyle}
			>
				{text}
			</motion.div>
		</div>
	);
}
