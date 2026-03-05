"use client";

import FaultyTerminal from "@/components/blocks/FaultyTerminal";

export const NotFoundTerminalBackground = () => {
	return (
		<div className="absolute inset-0 z-0">
			<FaultyTerminal
				scale={1.5}
				gridMul={[2, 1]}
				digitSize={1.2}
				timeScale={1}
				pause={false}
				scanlineIntensity={1}
				glitchAmount={1}
				flickerAmount={1}
				noiseAmp={1}
				chromaticAberration={0}
				dither={0}
				curvature={0}
				tint="#ffffff"
				mouseReact={false}
				mouseStrength={0.5}
				pageLoadAnimation={true}
				brightness={1}
				style={{}}
				className="h-full w-full pointer-events-none"
			/>
		</div>
	);
};
