"use client";

import { useEffect, useMemo, useRef } from "react";

interface GradientBackgroundProps {
  colorA?: string;
  colorB?: string;
  colorC?: string;
  colorD?: string;
  speed?: number;
  noiseIntensity?: number;
}

const defaultProps: GradientBackgroundProps = {
  colorA: "#e72770", // Pink
  colorB: "#4c3ded", // Purple
  colorC: "#f47432", // Orange
  colorD: "#3374f4", // Blue
  speed: 0.5,
  noiseIntensity: 0.02,
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0, 0, 0];
}

export function StripeGradient(props: GradientBackgroundProps = {}) {
  const mergedProps: any = { ...defaultProps, ...props };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const fragmentShader = useMemo(
    () => `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;
    uniform vec3 u_colorC;
    uniform vec3 u_colorD;
    uniform float u_noiseIntensity;

    // Simple pseudo-random function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // 2D noise function
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy/u_resolution.xy;
      float n = noise(uv * 10.0 + u_time);
      
      vec2 position = uv + n * u_noiseIntensity;
      
      float t = u_time;
      
      vec3 color1 = mix(u_colorA, u_colorB, sin(t) * 0.5 + 0.5);
      vec3 color2 = mix(u_colorC, u_colorD, cos(t * 1.3) * 0.5 + 0.5);
      
      vec3 color = mix(
        color1,
        color2,
        sin(position.x * 3.1415 + t) * cos(position.y * 3.1415 + t * 0.7)
      );
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
    [],
  );

  const vertexShader = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const program = createShaderProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const colorALocation = gl.getUniformLocation(program, "u_colorA");
    const colorBLocation = gl.getUniformLocation(program, "u_colorB");
    const colorCLocation = gl.getUniformLocation(program, "u_colorC");
    const colorDLocation = gl.getUniformLocation(program, "u_colorD");
    const noiseIntensityLocation = gl.getUniformLocation(
      program,
      "u_noiseIntensity",
    );

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const animate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      gl.viewport(0, 0, width, height);
      gl.useProgram(program);

      const time =
        ((Date.now() - startTimeRef.current) / 1000) * mergedProps.speed;
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform3fv(colorALocation, hexToRgb(mergedProps.colorA));
      gl.uniform3fv(colorBLocation, hexToRgb(mergedProps.colorB));
      gl.uniform3fv(colorCLocation, hexToRgb(mergedProps.colorC));
      gl.uniform3fv(colorDLocation, hexToRgb(mergedProps.colorD));
      gl.uniform1f(noiseIntensityLocation, mergedProps.noiseIntensity);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [fragmentShader, mergedProps]);

  return (
    <div className="fixed inset-0 -z-10">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ filter: "contrast(1.2) saturate(1.2)" }}
      />
    </div>
  );
}

function createShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string,
) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) return null;
  gl.shaderSource(vertexShader, vsSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) return null;
  gl.shaderSource(fragmentShader, fsSource);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  return program;
}
