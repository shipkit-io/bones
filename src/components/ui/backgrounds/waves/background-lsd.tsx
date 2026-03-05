"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { generateRainbowColor } from "@/lib/utils/colors";

export const WavesBackground: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d")!;
		let time = 0;
		const width = (canvas.width = window.innerWidth);
		const height = (canvas.height = window.innerHeight);

		// Generate many more layers with extreme parameters
		const generateLayers = () => {
			const layers = [];
			for (let i = 0; i < 15; i++) {
				layers.push({
					speed: 0.05 + Math.random() * 0.2,
					amplitude: 30 + Math.random() * 100,
					frequency: 0.005 + Math.random() * 0.015,
					phase: Math.random() * Math.PI * 2,
					verticalShift: Math.random() * height,
				});
			}
			return layers;
		};

		const layers = generateLayers();

		const draw = () => {
			// Create trailing effect
			ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
			ctx.fillRect(0, 0, width, height);

			// Draw each layer with dynamic colors and effects
			layers.forEach((layer, i) => {
				ctx.beginPath();
				ctx.strokeStyle = generateRainbowColor(time * 0.1 + i);
				ctx.lineWidth = 2 + Math.sin(time * 0.1) * 2;

				// Create multiple interweaving waves
				for (let x = 0; x < width; x += 2) {
					let y = 0;

					// Combine multiple sine waves for complexity
					for (let j = 1; j <= 3; j++) {
						y +=
							Math.sin(x * layer.frequency * j + time * layer.speed + layer.phase) *
							(layer.amplitude / j) *
							Math.sin(time * 0.2);

						y +=
							Math.cos((x + 30) * layer.frequency * j + time * layer.speed) *
							(layer.amplitude / j) *
							Math.cos(time * 0.15);
					}

					// Add vertical movement
					const verticalMove = Math.sin(time * layer.speed * 0.3) * 100;

					// Add kaleidoscopic effect
					const kaleidoscopic = Math.sin(x * 0.01 + time * 0.1) * 50;

					if (x === 0) {
						ctx.moveTo(x, layer.verticalShift + y + verticalMove + kaleidoscopic);
					} else {
						ctx.lineTo(x, layer.verticalShift + y + verticalMove + kaleidoscopic);
					}
				}

				// Add glow effect
				ctx.shadowColor = generateRainbowColor(time * 0.2 + i);
				ctx.shadowBlur = 10;
				ctx.stroke();
			});

			// Increase time variable for more rapid movement
			time += 0.2;
			requestAnimationFrame(draw);
		};

		draw();

		const handleResize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed top-0 left-0 w-full h-full bg-black"
			style={{
				filter: "contrast(1.2) saturate(1.5) brightness(1.2)",
				mixBlendMode: "screen",
			}}
		/>
	);
};

export default WavesBackground;
