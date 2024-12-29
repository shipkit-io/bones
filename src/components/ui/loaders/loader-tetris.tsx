"use client";

import { cn } from "@/lib/utils";
interface LoaderTetrisProps extends React.HTMLAttributes<HTMLDivElement> {
	size?: "sm" | "md" | "lg";
	primaryColor?: string;
	secondaryColor?: string;
	speed?: number;
	className?: string;
}

const sizeMap = {
	sm: { w: 48, h: 56 },
	md: { w: 96, h: 112 },
	lg: { w: 144, h: 168 },
};

export const LoaderTetris = ({
	size = "md",
	primaryColor = "#c227fa22",
	secondaryColor = "#f86bd773",
	speed = 1.5,
	className,
	...props
}: LoaderTetrisProps) => {
	// Create SVG data URL with custom colors
	const svgUrl = React.useMemo(() => {
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 684">
				<path fill="${primaryColor}" d="M305.7 0L0 170.9v342.3L305.7 684 612 513.2V170.9L305.7 0z"/>
				<path fill="${secondaryColor}" d="M305.7 80.1l-233.6 131 233.6 131 234.2-131-234.2-131"/>
			</svg>
		`.trim();
		return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
	}, [primaryColor, secondaryColor]);

	const { w, h } = sizeMap[size];

	return (
		<div className={cn("tetrominos-wrapper", className)} {...props}>
			<div
				className="tetrominos"
				style={
					{
						"--w": `${w}px`,
						"--h": `${h}px`,
						"--speed": `${speed}s`,
					} as React.CSSProperties
				}
			>
				<div
					className="tetromino box1"
					style={{ backgroundImage: `url('${svgUrl}')` }}
				/>
				<div
					className="tetromino box2"
					style={{ backgroundImage: `url('${svgUrl}')` }}
				/>
				<div
					className="tetromino box3"
					style={{ backgroundImage: `url('${svgUrl}')` }}
				/>
				<div
					className="tetromino box4"
					style={{ backgroundImage: `url('${svgUrl}')` }}
				/>
			</div>

			<style jsx>{`
				.tetrominos-wrapper {
					position: relative;
					width: 100%;
					height: 100%;
					min-height: calc(var(--h) * 3);
				}

				.tetrominos {
					--xspace: calc(var(--w) / 2);
					--yspace: calc(var(--h) / 4 - 1px);
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(calc(-1 * var(--h)), calc(-1 * var(--w)));
				}

				.tetromino {
					width: var(--w);
					height: var(--h);
					position: absolute;
					transition: all ease 0.3s;
					background-position: center;
					background-repeat: no-repeat;
					background-size: contain;
				}

				.box1 {
					animation: tetromino1 var(--speed) ease-out infinite;
				}
				.box2 {
					animation: tetromino2 var(--speed) ease-out infinite;
				}
				.box3 {
					animation: tetromino3 var(--speed) ease-out infinite;
					z-index: 2;
				}
				.box4 {
					animation: tetromino4 var(--speed) ease-out infinite;
				}

				@keyframes tetromino1 {
					0%,
					40% {
						transform: translate(0, 0);
					}
					50% {
						transform: translate(var(--xspace), calc(-1 * var(--yspace)));
					}
					60%,
					100% {
						transform: translate(calc(var(--xspace) * 2), 0);
					}
				}

				@keyframes tetromino2 {
					0%,
					20% {
						transform: translate(calc(var(--xspace) * 2), 0);
					}
					40%,
					100% {
						transform: translate(calc(var(--xspace) * 3), var(--yspace));
					}
				}

				@keyframes tetromino3 {
					0% {
						transform: translate(calc(var(--xspace) * 3), var(--yspace));
					}
					20%,
					60% {
						transform: translate(
							calc(var(--xspace) * 2),
							calc(var(--yspace) * 2)
						);
					}
					90%,
					100% {
						transform: translate(var(--xspace), var(--yspace));
					}
				}

				@keyframes tetromino4 {
					0%,
					60% {
						transform: translate(var(--xspace), var(--yspace));
					}
					90%,
					100% {
						transform: translate(0, 0);
					}
				}
			`}</style>
		</div>
	);
};
