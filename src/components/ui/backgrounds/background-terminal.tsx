"use client";

import { Component, type ReactNode } from "react";
import FaultyTerminal from "@/components/blocks/FaultyTerminal";

/**
 * Decorative WebGL background. If the shader fails to compile, the GPU is
 * unavailable, or rendering throws for any other reason, swallow the error
 * and render nothing — the surrounding page (e.g. not-found) must not crash
 * because of a background animation.
 */
class SilentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* swallow — decorative */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export const NotFoundTerminalBackground = () => {
  return (
    <SilentBoundary>
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
          className="pointer-events-none h-full w-full"
        />
      </div>
    </SilentBoundary>
  );
};
