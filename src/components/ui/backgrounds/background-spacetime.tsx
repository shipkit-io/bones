"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

export const BackgroundSpacetime: React.FC = () => {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const updateDimensions = () => {
			setDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		updateDimensions();
		window.addEventListener("resize", updateDimensions);

		return () => window.removeEventListener("resize", updateDimensions);
	}, []);

	const gridSize = 60; // Increased grid size for better visibility
	const rows = Math.ceil(dimensions.height / gridSize);
	const cols = Math.ceil(dimensions.width / gridSize);

	const generateGrid = () => {
		const grid = [];
		for (let y = 0; y <= rows; y++) {
			for (let x = 0; x <= cols; x++) {
				grid.push({ x, y });
			}
		}
		return grid;
	};

	const grid = generateGrid();

	return (
		<div className="fixed inset-0 z-[-1] bg-gradient-to-br from-gray-900 to-blue-900">
			<svg width="100%" height="100%">
				<defs>
					<linearGradient id="grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#4F46E5" />
						<stop offset="50%" stopColor="#7C3AED" />
						<stop offset="100%" stopColor="#DB2777" />
					</linearGradient>
				</defs>
				{grid.map((point, index) => (
					<React.Fragment key={`grid-${index}`}>
						{point.x < cols && (
							<motion.line
								x1={point.x * gridSize}
								y1={point.y * gridSize}
								x2={(point.x + 1) * gridSize}
								y2={point.y * gridSize}
								stroke="url(#grid-gradient)"
								strokeWidth="1"
								initial={{ y1: point.y * gridSize, y2: point.y * gridSize }}
								animate={{
									y1: [
										point.y * gridSize,
										point.y * gridSize + Math.sin(point.x / 2) * 20,
										point.y * gridSize,
									],
									y2: [
										point.y * gridSize,
										point.y * gridSize + Math.sin((point.x + 1) / 2) * 20,
										point.y * gridSize,
									],
								}}
								transition={{
									repeat: Number.POSITIVE_INFINITY,
									repeatType: "reverse",
									duration: 15,
									ease: "easeInOut",
								}}
							/>
						)}
						{point.y < rows && (
							<motion.line
								x1={point.x * gridSize}
								y1={point.y * gridSize}
								x2={point.x * gridSize}
								y2={(point.y + 1) * gridSize}
								stroke="url(#grid-gradient)"
								strokeWidth="1"
								initial={{ x1: point.x * gridSize, x2: point.x * gridSize }}
								animate={{
									x1: [
										point.x * gridSize,
										point.x * gridSize + Math.sin(point.y / 2) * 20,
										point.x * gridSize,
									],
									x2: [
										point.x * gridSize,
										point.x * gridSize + Math.sin((point.y + 1) / 2) * 20,
										point.x * gridSize,
									],
								}}
								transition={{
									repeat: Number.POSITIVE_INFINITY,
									repeatType: "reverse",
									duration: 15,
									ease: "easeInOut",
								}}
							/>
						)}
					</React.Fragment>
				))}
			</svg>
		</div>
	);
};
