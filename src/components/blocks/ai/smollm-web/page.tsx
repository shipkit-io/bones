// @ts-nocheck
"use client";

import dynamic from "next/dynamic";
import Script from "next/script";
import { useEffect } from "react";

const AISmollmWebGPU = dynamic(
	async () => {
		const module = await import("./ai-smollm-webgpu");
		return module.AISmollmWebGPU;
	},
	{ ssr: false }
);

export default function Page() {
	useEffect(() => {
		window.MathJax = {
			tex: {
				inlineMath: [
					["$", "$"],
					["\\(", "\\)"],
				],
			},
			svg: {
				fontCache: "global",
			},
		};
	}, []);

	return (
		<>
			<Script
				id="mathjax-script"
				src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
				strategy="lazyOnload"
			/>
			<AISmollmWebGPU />
		</>
	);
}
