"use client";

import { type FC, useEffect, useRef } from "react";

export const calculateWaveY = (
	x: number,
	time: number,
	layer: number,
	height: number,
	config: WaveConfig
): number => {
	const baseY = height / 2;
	return (
		baseY +
		Math.sin(x * config.frequency * 0.01 + time + layer) * (50 * config.amplitude) +
		Math.sin(x * config.frequency * 0.02 + time * 1.2) * (30 * config.amplitude) +
		Math.sin(x * config.frequency * 0.003 + time * 0.3) * (100 * config.amplitude)
	);
};

export const getWaveColor = (time: number, layer: number, config: WaveConfig): string => {
	const hue = (time + layer * 120) % 360;
	return `hsl(${hue}, ${config.saturation}%, ${config.brightness}%)`;
};

export interface WaveConfig {
	speed: number;
	saturation: number;
	brightness: number;
	amplitude: number;
	frequency: number;
	layers: number;
	backgroundColor?: string;
	fadeOpacity?: number;
	transparent?: boolean;
}

interface WavesBackgroundProps {
	config: WaveConfig;
}

export const WavesBackground: FC<WavesBackgroundProps> = ({
	config = {
		speed: 0.05,
		saturation: 50,
		brightness: 50,
		amplitude: 10,
		frequency: 0.01,
		layers: 10,
		backgroundColor: "#000000",
		fadeOpacity: 0.05,
		transparent: false,
	},
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number | null>(null);
	const timeRef = useRef<number>(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { alpha: true });
		if (!ctx) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		const width = canvas.width;
		const height = canvas.height;

		const animate = () => {
			if (config.transparent) {
				ctx.clearRect(0, 0, width, height);
			} else {
				ctx.fillStyle = `rgba(${hexToRgb(config.backgroundColor || "#000000")}, ${config.fadeOpacity || 0.05})`;
				ctx.fillRect(0, 0, width, height);
			}

			for (let i = 0; i < config.layers; i++) {
				ctx.beginPath();
				ctx.strokeStyle = getWaveColor(timeRef.current, i, config);
				ctx.lineWidth = 2;

				for (let x = 0; x < width + 20; x += 5) {
					const y = calculateWaveY(x, timeRef.current, i, height, config);

					if (x === 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}
				ctx.stroke();
			}

			timeRef.current += config.speed;
			animationRef.current = requestAnimationFrame(animate);
		};

		animate();

		const handleResize = () => {
			if (!canvas) return;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			if (animationRef.current !== null) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
		};
	}, [config]);

	// Helper function to convert hex to RGB
	const hexToRgb = (hexCode: string): string => {
		// Remove the # if present
		const hex = hexCode.replace("#", "");

		// Parse the hex values
		const r = Number.parseInt(hex.substring(0, 2), 16);
		const g = Number.parseInt(hex.substring(2, 4), 16);
		const b = Number.parseInt(hex.substring(4, 6), 16);

		return `${r}, ${g}, ${b}`;
	};

	return (
		<canvas
			ref={canvasRef}
			className="fixed left-0 top-0 -z-10 h-full w-full"
			style={{
				background: config.transparent
					? "transparent"
					: `linear-gradient(to bottom, ${config.backgroundColor || "#000000"}, ${
							config.backgroundColor === "#000000"
								? "#1a0f1f"
								: adjustColor(config.backgroundColor || "#000000", -20)
						})`,
			}}
		/>
	);
};

// Helper function to darken/lighten a color
function adjustColor(color: string, amount: number): string {
	const hex = color.replace("#", "");
	const num = Number.parseInt(hex, 16);

	let r = (num >> 16) + amount;
	let g = ((num >> 8) & 0x00ff) + amount;
	let b = (num & 0x0000ff) + amount;

	r = Math.min(Math.max(0, r), 255);
	g = Math.min(Math.max(0, g), 255);
	b = Math.min(Math.max(0, b), 255);

	return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, "0")}`;
}
