"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export const Boxes = () => {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const boxRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (boxRef.current) {
				const rect = boxRef.current.getBoundingClientRect();
				setMousePosition({
					x: e.clientX - rect.left,
					y: e.clientY - rect.top,
				});
			}
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);

	const boxes = [];
	const rows = 10;
	const cols = 10;

	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			boxes.push(
				<motion.div
					key={`${i}-${j}`}
					className="h-[50px] w-[50px] rounded-lg border border-neutral-200/[0.1] bg-neutral-100/[0.1] dark:border-neutral-800/[0.1] dark:bg-neutral-900/[0.1]"
					initial={{
						opacity: 0,
						scale: 0.5,
					}}
					animate={{
						opacity: 1,
						scale: 1,
						transition: {
							duration: 0.5,
							delay: (i + j) * 0.1,
						},
					}}
					whileHover={{
						scale: 2,
						transition: {
							duration: 0.2,
						},
					}}
					style={{
						transform: `perspective(1000px) rotateX(${
							(mousePosition.y - (i * 50 + 25)) / 20
						}deg) rotateY(${(mousePosition.x - (j * 50 + 25)) / 20}deg)`,
					}}
				/>
			);
		}
	}

	return (
		<div
			ref={boxRef}
			className="grid grid-cols-10 gap-[2px] rounded-lg p-4"
			style={{
				perspective: "1000px",
			}}
		>
			{boxes}
		</div>
	);
};
