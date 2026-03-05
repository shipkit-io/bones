"use client";

import type React from "react";
import { useEffect, useRef } from "react";

interface SubtleBackgroundProps {
	intensity: number;
}

const BackgroundColors: React.FC<SubtleBackgroundProps> = ({ intensity }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationFrameId: number;

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		const createGradient = (x: number, y: number, r: number, opacity: number) => {
			const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
			gradient.addColorStop(0, `rgba(99, 102, 241, ${opacity * 0.25 * intensity})`); // Indigo
			gradient.addColorStop(0.5, `rgba(167, 139, 250, ${opacity * 0.2 * intensity})`); // Purple
			gradient.addColorStop(1, `rgba(59, 130, 246, ${opacity * 0.15 * intensity})`); // Blue
			return gradient;
		};

		const drawGradients = (time: number) => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const centerX = canvas.width / 2;
			const centerY = canvas.height / 2;
			const maxRadius = Math.max(canvas.width, canvas.height) * 0.8;

			// Main central gradient
			const mainGradient = createGradient(centerX, centerY, maxRadius, 1);
			ctx.fillStyle = mainGradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Animated subtle gradients
			const numGradients = 5;
			for (let i = 0; i < numGradients; i++) {
				const angle =
					(time * 0.0001 * intensity + i * ((Math.PI * 2) / numGradients)) % (Math.PI * 2);
				const x = centerX + Math.cos(angle) * maxRadius * 0.4 * intensity;
				const y = centerY + Math.sin(angle) * maxRadius * 0.4 * intensity;
				const opacity = (Math.sin(time * 0.001 * intensity + i) + 1) / 2;
				const gradient = createGradient(x, y, maxRadius * 0.6, opacity);
				ctx.fillStyle = gradient;
				ctx.globalCompositeOperation = "screen";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
		};

		const animate = (time: number) => {
			drawGradients(time);
			animationFrameId = requestAnimationFrame(animate);
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);
		animate(0);

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			cancelAnimationFrame(animationFrameId);
		};
	}, [intensity]);

	return <canvas ref={canvasRef} className="fixed inset-0 z-[-1] bg-gray-900" />;
};

export default BackgroundColors;
