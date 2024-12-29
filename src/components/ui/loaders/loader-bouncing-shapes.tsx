"use client";

import { useEffect, useRef } from "react";

const TYPES = [
	"circle",
	"semi-circle",
	"square",
	"triangle",
	"triangle-2",
	"rectangle",
];
const COLORS = [
	"#836ee5",
	"#fe94b4",
	"#49d2f5",
	"#ff5354",
	"#00b1b4",
	"#ffe465",
	"#0071ff",
	"#03274b",
];

export const LoaderBouncingShapes = () => {
	const shapesRef = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		const shapes = shapesRef.current.filter(Boolean);

		shapes.forEach((shape, index) => {
			if (!shape) return;

			const interval = setInterval(() => {
				const classList = shape.classList;
				shape.className = "shape";

				// Assign styles
				classList.add(TYPES[Math.floor(Math.random() * TYPES.length)]);
				const offset = Math.random() * 4 - 2;
				const opp = offset >= 0 ? "+ " : "- ";
				const styles = [
					["left", `calc(50% ${opp}${Math.abs(offset)}vw)`],
					["--bounce-variance", `${Math.random() * 20 - 10}vh`],
					["--base_scale", `${Math.random() * 6 + 4}vh`],
					["--rotation", `${Math.random() * 180 - 90}deg`],
					["--color", COLORS[Math.floor(Math.random() * COLORS.length)]],
				];

				styles.forEach(([property, value]) => {
					shape.style.setProperty(property, value);
				});

				// Animate
				if (!classList.contains("bounce-up")) {
					classList.add("bounce-up");
				}
				classList.replace("bounce-down", "bounce-up");
				setTimeout(() => {
					classList.replace("bounce-up", "bounce-down");
				}, 400);
			}, 740);

			return () => clearInterval(interval);
		});
	}, []);

	return (
		<>
			<style jsx global>{`
				:root {
					--base_scale: 5vh;
					--floor: 15vh;
					--color: #836ee5;
				}

				.loader {
					position: relative;
					width: 100%;
					height: 100vh;
					overflow-y: hidden;
				}

				.shape {
					position: absolute;
					display: block;
					left: 50%;
					bottom: 0;
					margin-left: calc(-1 * (var(--base_scale) / 2));
					margin-bottom: var(--floor);
				}

				.shape.circle {
					width: var(--base_scale);
					height: var(--base_scale);
					background: var(--color);
					border-radius: 50%;
				}

				.shape.semi-circle {
					height: calc(var(--base_scale) * 2);
					width: var(--base_scale);
					background: var(--color);
					border-bottom-right-radius: calc(var(--base_scale) * 2);
					border-top-right-radius: calc(var(--base_scale) * 2);
				}

				.shape.square {
					width: var(--base_scale);
					height: var(--base_scale);
					background: var(--color);
				}

				.shape.rectangle {
					width: calc(var(--base_scale) * 1.5);
					height: var(--base_scale);
					background: var(--color);
				}

				.shape.triangle {
					width: 0;
					height: 0;
					border-bottom: var(--base_scale) solid var(--color);
					border-right: var(--base_scale) solid transparent;
				}

				.shape.triangle-2 {
					width: 0;
					height: 0;
					border-top: var(--base_scale) solid var(--color);
					border-left: var(--base_scale) solid transparent;
				}

				.shape.bounce-up {
					--bounce-variance: 0vh;
					--bounce-height: calc(
						-1 * 50vh - calc(var(--base_scale) - var(--floor) +
									var(--bounce-variance))
					);
					transition: transform 400ms cubic-bezier(0.215, 0.61, 0.355, 1);
					transform: translateY(var(--bounce-height)) rotate(0deg);
				}

				.shape.bounce-down {
					transition: transform 300ms cubic-bezier(0.6, 0.04, 0.98, 0.335);
					transform: translateY(0) rotate(var(--rotation));
				}
			`}</style>
			<div className="loader">
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						ref={(el) => (shapesRef.current[i] = el)}
						className="shape"
					/>
				))}
			</div>
		</>
	);
};
