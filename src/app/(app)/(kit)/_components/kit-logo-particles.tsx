"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

export const KitLogoParticles = () => {
	const { theme } = useTheme();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const mousePositionRef = useRef({ x: 0, y: 0 });
	const isTouchingRef = useRef(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas || !container) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const updateCanvasSize = () => {
			const rect = container.getBoundingClientRect();
			canvas.width = rect.width;
			canvas.height = rect.height;
			setIsMobile(rect.width < 768);
		};

		updateCanvasSize();

		let particles: {
			x: number;
			y: number;
			baseX: number;
			baseY: number;
			size: number;
			color: string;
			scatteredColor: string;
			life: number;
			isAWS: boolean;
			// Fission animation properties
			burstState: "normal" | "exploding" | "returning";
			burstRadius: number;
			burstAngle: number;
			burstSpeed: number;
			burstProgress: number;
			burstMaxRadius: number;
		}[] = [];

		// Define theme-based colors
		const particleBaseColor = theme === "dark" ? "white" : "black";
		const particleScatterColor = theme === "dark" ? "#00DCFF" : "#4F46E5"; // Cyan for dark, Indigo for light

		// Track global fission state
		const globalFissionState = {
			active: false,
			timer: 0,
			nextBurstTime: Math.random() * 5000 + 5000, // Random time between 5-10 seconds
			burstDuration: 1500, // Duration of the burst animation in ms
			returnDuration: 1000, // Duration of the return animation in ms
		};

		let lastTimestamp = 0;
		let textImageData: ImageData | null = null;

		function createTextImage() {
			if (!ctx || !canvas) return 0;

			ctx.fillStyle = particleBaseColor; // Use theme-based color for text rendering
			ctx.save();

			// Set up text properties
			const fontSize = isMobile ? 60 : 120;
			ctx.font = `bold ${fontSize}px sans-serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			// Draw "shipkit" text
			const text = "shipkit";
			const textMetrics = ctx.measureText(text);
			const textWidth = textMetrics.width;

			ctx.fillText(text, canvas.width / 2, canvas.height / 2);

			ctx.restore();

			textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			return fontSize / 20; // Return a scale factor
		}

		function createParticle(scale: number) {
			if (!ctx || !canvas || !textImageData) return null;

			const data = textImageData.data;
			const particleGap = 2;

			for (let attempt = 0; attempt < 100; attempt++) {
				const x = Math.floor(Math.random() * canvas.width);
				const y = Math.floor(Math.random() * canvas.height);

				const dataIndex = (y * canvas.width + x) * 4 + 3;
				if (dataIndex < data.length && data[dataIndex] && data[dataIndex] > 128) {
					const burstAngle = Math.random() * Math.PI * 2;
					const burstMaxRadius = Math.random() * 100 + 100;

					return {
						x: x,
						y: y,
						baseX: x,
						baseY: y,
						size: Math.random() * 1 + 0.5,
						color: particleBaseColor,
						scatteredColor: particleScatterColor,
						isAWS: false, // Keep this for compatibility but it's not used
						life: Math.random() * 100 + 50,
						// Fission animation properties
						burstState: "normal" as const,
						burstRadius: 0,
						burstAngle,
						burstSpeed: Math.random() * 0.5 + 0.5,
						burstProgress: 0,
						burstMaxRadius,
					};
				}
			}

			return null;
		}

		function createInitialParticles(scale: number) {
			if (!canvas) return; // Fix: Add null check for canvas
			const baseParticleCount = 7000; // Increased base count for higher density
			const particleCount = Math.floor(
				baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080))
			);
			for (let i = 0; i < particleCount; i++) {
				const particle = createParticle(scale);
				if (particle) particles.push(particle);
			}
		}

		let animationFrameId: number;

		function animate(timestamp: number) {
			if (!ctx || !canvas) return;

			// Calculate delta time for smooth animations
			const deltaTime = timestamp - lastTimestamp;
			lastTimestamp = timestamp;

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			// Removed the black background fill to make it transparent
			// ctx.fillStyle = "black"
			// ctx.fillRect(0, 0, canvas.width, canvas.height)

			const { x: mouseX, y: mouseY } = mousePositionRef.current;
			const maxDistance = isMobile ? 100 : 240;

			// Update global fission state
			globalFissionState.timer += deltaTime;
			if (
				!globalFissionState.active &&
				globalFissionState.timer > globalFissionState.nextBurstTime
			) {
				// Start a new fission burst
				globalFissionState.active = true;
				globalFissionState.timer = 0;

				// Set all particles to exploding state
				for (const p of particles) {
					p.burstState = "exploding";
					p.burstProgress = 0;
				}
			}

			// If fission is active, check if we need to transition states
			if (globalFissionState.active) {
				if (
					globalFissionState.timer > globalFissionState.burstDuration &&
					particles[0]?.burstState === "exploding"
				) {
					// Transition to returning state
					for (const p of particles) {
						p.burstState = "returning";
						p.burstProgress = 0;
					}
				} else if (
					globalFissionState.timer >
					globalFissionState.burstDuration + globalFissionState.returnDuration
				) {
					// End the fission animation
					globalFissionState.active = false;
					globalFissionState.timer = 0;
					globalFissionState.nextBurstTime = Math.random() * 5000 + 5000; // 5-10 seconds

					// Reset all particles to normal state
					for (const p of particles) {
						p.burstState = "normal";
						p.burstRadius = 0;
						p.burstProgress = 0;
					}
				}
			}

			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				if (!p) continue;

				let currentX = p.x;
				let currentY = p.y;
				let particleColor = particleBaseColor; // Default to theme base color

				// Handle fission animation states
				if (p.burstState === "exploding") {
					// Calculate progress (0 to 1)
					p.burstProgress += deltaTime / globalFissionState.burstDuration;
					p.burstProgress = Math.min(p.burstProgress, 1);

					// Calculate current radius based on progress (with easing)
					const easedProgress = p.burstProgress * (2 - p.burstProgress); // Ease out quad
					p.burstRadius = easedProgress * p.burstMaxRadius;

					// Calculate position based on burst radius and angle
					currentX = p.baseX + Math.cos(p.burstAngle) * p.burstRadius;
					currentY = p.baseY + Math.sin(p.burstAngle) * p.burstRadius;

					// Change color based on progress - Adjust for light/dark themes
					if (theme === "dark") {
						const intensity = Math.min(255, Math.floor(p.burstProgress * 255));
						particleColor = `rgb(${intensity}, ${Math.floor(220 * p.burstProgress)}, ${255})`;
					} else {
						// Darker explosion effect for light theme
						const intensity = Math.max(0, Math.floor(50 * (1 - p.burstProgress))); // Start darker, fade towards base
						const blueIntensity = Math.max(0, Math.floor(100 * (1 - p.burstProgress)));
						particleColor = `rgb(${intensity}, ${intensity}, ${blueIntensity})`;
					}
				} else if (p.burstState === "returning") {
					// Calculate progress (0 to 1)
					p.burstProgress += deltaTime / globalFissionState.returnDuration;
					p.burstProgress = Math.min(p.burstProgress, 1);

					// Calculate current radius based on progress (with easing)
					const easedProgress = 1 - (1 - p.burstProgress) * (1 - p.burstProgress); // Ease in quad
					p.burstRadius = p.burstMaxRadius * (1 - easedProgress);

					// Calculate position based on burst radius and angle
					currentX = p.baseX + Math.cos(p.burstAngle) * p.burstRadius;
					currentY = p.baseY + Math.sin(p.burstAngle) * p.burstRadius;

					// Fade color back to base color - Adjust for light/dark themes
					if (theme === "dark") {
						const intensity = Math.floor(255 * p.burstProgress);
						particleColor = `rgb(${255}, ${Math.floor(255 - 35 * (1 - p.burstProgress))}, ${Math.floor(255 - 55 * (1 - p.burstProgress))})`;
					} else {
						// Fade from darker explosion color back to black
						const progressInv = 1 - p.burstProgress;
						const intensity = Math.floor(50 * progressInv); // Fade from dark grey to black
						const blueIntensity = Math.floor(100 * progressInv);
						particleColor = `rgb(${intensity}, ${intensity}, ${blueIntensity})`;
					}
				} else {
					// Normal state - handle mouse interaction
					const dx = mouseX - p.x;
					const dy = mouseY - p.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (distance < maxDistance && (isTouchingRef.current || !("ontouchstart" in window))) {
						const force = (maxDistance - distance) / maxDistance;
						const angle = Math.atan2(dy, dx);
						const moveX = Math.cos(angle) * force * 60;
						const moveY = Math.sin(angle) * force * 60;
						currentX = p.baseX - moveX;
						currentY = p.baseY - moveY;

						particleColor = p.scatteredColor; // Use theme-based scatter color
					} else {
						currentX += (p.baseX - currentX) * 0.1;
						currentY += (p.baseY - currentY) * 0.1;
						particleColor = particleBaseColor; // Use theme-based base color
					}
				}

				// Update particle position
				p.x = currentX;
				p.y = currentY;

				// Draw the particle
				ctx.fillStyle = particleColor;
				ctx.fillRect(p.x, p.y, p.size, p.size);

				// Handle particle lifecycle
				p.life--;
				if (p.life <= 0) {
					const newParticle = createParticle(1);
					if (newParticle) {
						particles[i] = newParticle;
					} else {
						particles.splice(i, 1);
						i--;
					}
				}
			}

			// Maintain particle count
			const baseParticleCount = 7000;
			const targetParticleCount = Math.floor(
				baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080))
			);
			while (particles.length < targetParticleCount) {
				const newParticle = createParticle(1);
				if (newParticle) particles.push(newParticle);
			}

			animationFrameId = requestAnimationFrame(animate);
		}

		const scale = createTextImage();
		createInitialParticles(scale);
		animationFrameId = requestAnimationFrame(animate);

		const handleResize = () => {
			updateCanvasSize();
			const newScale = createTextImage();
			particles = [];
			createInitialParticles(newScale);
		};

		const handleMove = (clientX: number, clientY: number) => {
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			mousePositionRef.current = {
				x: clientX - rect.left,
				y: clientY - rect.top,
			};
		};

		const handleMouseMove = (e: MouseEvent) => {
			handleMove(e.clientX, e.clientY);
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length > 0 && e.touches[0]) {
				e.preventDefault();
				handleMove(e.touches[0].clientX, e.touches[0].clientY);
			}
		};

		const handleTouchStart = () => {
			isTouchingRef.current = true;
		};

		const handleTouchEnd = () => {
			isTouchingRef.current = false;
			mousePositionRef.current = { x: 0, y: 0 };
		};

		const handleMouseLeave = () => {
			if (!("ontouchstart" in window)) {
				mousePositionRef.current = { x: 0, y: 0 };
			}
		};

		window.addEventListener("resize", handleResize);
		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
		canvas.addEventListener("mouseleave", handleMouseLeave);
		canvas.addEventListener("touchstart", handleTouchStart);
		canvas.addEventListener("touchend", handleTouchEnd);

		return () => {
			window.removeEventListener("resize", handleResize);
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("touchmove", handleTouchMove);
			canvas.removeEventListener("mouseleave", handleMouseLeave);
			canvas.removeEventListener("touchstart", handleTouchStart);
			canvas.removeEventListener("touchend", handleTouchEnd);
			cancelAnimationFrame(animationFrameId);
		};
	}, [isMobile, theme]);

	return (
		<div ref={containerRef} className="relative h-full w-full overflow-hidden">
			<canvas
				ref={canvasRef}
				className="absolute left-0 top-0 h-full w-full"
				aria-label="Interactive particle effect with shipkit logo and fission animation"
			/>
		</div>
	);
};
