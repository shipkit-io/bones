"use client";
import { type ComponentProps, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MouseEvent {
	movementY: number;
	clientX: number;
}

export function WavyLine({ className, ...props }: ComponentProps<"div">) {
	const path = useRef<SVGPathElement>(null);
	const parentRef = useRef<HTMLDivElement>(null);

	let progress = 0;
	let x = 0.5;
	let time = Math.PI / 2;
	let reqId: number | null = null;

	// Use the useEffect hook to set the path on component mount
	// biome-ignore lint/correctness/useExhaustiveDependencies: <Need to run only once>
	useEffect(() => {
		setSvgPath(progress);
	}, []);

	const setSvgPath = (progress: number) => {
		const width = parentRef.current?.clientWidth ?? window.innerWidth * 1;

		// Set the "d" attribute of the SVG path element using a quadratic Bézier curve
		path.current?.setAttributeNS(null, "d", `M0 50 Q${width * x} ${50 + progress}, ${width} 50`);
	};

	// Define a linear interpolation function
	const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

	// Define a function to handle mouse enter events
	const handleMouseEnter = () => {
		// If there is an animation frame request, cancel it and reset the animation
		if (reqId) {
			cancelAnimationFrame(reqId);
			resetAnimation();
		}
	};

	const handleMouseMove = (e: MouseEvent) => {
		// Get the movementY and clientX properties from the event object
		const { movementY, clientX } = e;

		// Get the bounding rectangle of the SVG path element
		const pathBound = path.current?.getBoundingClientRect();

		// If the bounding rectangle exists, update x and progress and set the path
		if (pathBound) {
			x = (clientX - pathBound.left) / pathBound.width;
			progress += movementY;
			setSvgPath(progress);
		}
	};

	const handleMouseLeave = () => {
		animateOut();
	};

	// Define a function to animate out
	const animateOut = () => {
		// Calculate newProgress using sine of time
		const newProgress = progress * Math.sin(time);

		// Update progress using linear interpolation towards zero
		progress = lerp(progress, 0, 0.025);

		time += 0.2;

		// Set the path using newProgress
		setSvgPath(newProgress);

		// If progress is greater than a threshold, request another animation frame,
		// otherwise reset the animation.
		if (Math.abs(progress) > 0.75) {
			reqId = requestAnimationFrame(animateOut);
		} else {
			resetAnimation();
		}
	};

	const resetAnimation = () => {
		time = Math.PI / 2;
		progress = 0;
	};

	return (
		<div className={cn("relative h-px w-full", className)} {...props} ref={parentRef}>
			<div
				className="relative -top-5 z-10 h-10 w-full"
				onMouseEnter={handleMouseEnter}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
			/>
			<svg className="absolute -top-[50px] h-[100px] w-full">
				<title>Wavy Line</title>
				<path
					ref={path}
					className="fill-none stroke-current stroke-[1px] text-neutral-800 dark:text-neutral-200"
				/>
			</svg>
		</div>
	);
}
