"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const loaderVariants = cva("loader", {
	variants: {
		size: {
			default: "w-16 h-16",
			sm: "w-12 h-12",
			lg: "w-20 h-20",
		},
		color: {
			default: "[--loader-color:theme(colors.primary.DEFAULT)]",
			primary: "[--loader-color:theme(colors.primary.DEFAULT)]",
			secondary: "[--loader-color:theme(colors.secondary.DEFAULT)]",
			muted: "[--loader-color:theme(colors.muted.DEFAULT)]",
		},
	},
	defaultVariants: {
		size: "default",
		color: "default",
	},
});

export interface LoaderAtomsProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof loaderVariants> {
	label?: string;
}

export const LoaderAtoms = React.forwardRef<HTMLDivElement, LoaderAtomsProps>(
	({ className, size, color, label, ...props }, ref) => {
		return (
			<div
				ref={ref}
				role="status"
				aria-label={label || "Loading"}
				className={cn("relative", className)}
				{...props}
			>
				<div className={cn(loaderVariants({ size, color }))}>
					<div className="inner one" />
					<div className="inner two" />
					<div className="inner three" />
				</div>
				{label && <span className="sr-only">{label}</span>}
				<style jsx>{`
					.loader {
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						border-radius: 50%;
						perspective: 800px;
					}

					.inner {
						position: absolute;
						box-sizing: border-box;
						width: 100%;
						height: 100%;
						border-radius: 50%;
					}

					.inner.one {
						left: 0%;
						top: 0%;
						animation: rotate-one 1s linear infinite;
						border-bottom: 3px solid var(--loader-color);
					}

					.inner.two {
						right: 0%;
						top: 0%;
						animation: rotate-two 1s linear infinite;
						border-right: 3px solid var(--loader-color);
					}

					.inner.three {
						right: 0%;
						bottom: 0%;
						animation: rotate-three 1s linear infinite;
						border-top: 3px solid var(--loader-color);
					}

					@keyframes rotate-one {
						0% {
							transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg);
						}
						100% {
							transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg);
						}
					}

					@keyframes rotate-two {
						0% {
							transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg);
						}
						100% {
							transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg);
						}
					}

					@keyframes rotate-three {
						0% {
							transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg);
						}
						100% {
							transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg);
						}
					}
				`}</style>
			</div>
		);
	},
);
