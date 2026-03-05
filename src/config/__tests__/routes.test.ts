import { describe, expect, it } from "vitest";
import { routes } from "../routes";

describe("Routes Configuration", () => {
	describe("Route Format Validation", () => {
		const validateRoutes = (obj: Record<string, any>, parentPath = "") => {
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === "string") {
					it(`${parentPath}${key} should be a valid route format`, () => {
						// Check if route starts with /
						expect(value).toMatch(/^\//);

						// Check for no trailing slash (unless it's just /)
						expect(value).toMatch(/^\/.*[^/]$|^\/$/);

						// Check for no double slashes
						expect(value).not.toMatch(/\/\//);

						// Check for kebab-case in path segments
						const segments = value.split("/").slice(1);
						for (const segment of segments) {
							if (segment && !segment.startsWith(":")) {
								expect(segment).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
							}
						}
					});
				} else if (typeof value === "object" && value !== null) {
					validateRoutes(value, `${key}.`);
				}
			}
		};

		validateRoutes(routes);
	});

	describe("AI Routes Validation", () => {
		it("should have all required AI route properties", () => {
			expect(routes.ai).toBeDefined();
			expect(routes.ai.index).toBe("/ai");

			// Test specific AI routes
			const requiredAiRoutes = [
				"codeCompletion",
				"crossEncoder",
				"spam",
				"reportGen",
				"moonshineWeb",
				"zeroShotClassification",
				"whisper",
				"wwjhd",
				"whisperTimestamped",
				"webgpuNomicEmbed",
				"webgpuEmbeddingBenchmark",
				"webgpuClip",
				"videoObjectDetection",
				"videoBackgroundRemoval",
				"typeAhead",
				"textToSpeechWebgpu",
				"speecht5Web",
				"smolvmWeb",
				"smollmWeb",
				"semanticSearch",
				"semanticImageSearchWeb",
				"removeBackground",
				"removeBackgroundWeb",
				"phi35Webgpu",
				"musicgenWeb",
				"llama32Webgpu",
				"llama32ReasoningWebgpu",
				"janusWebgpu",
				"janusProWebgpu",
				"isSpam",
				"gemma22bJpnWebgpu",
				"florence2Web",
				"deepseekWeb",
			] as const;

			type AiRouteKey = (typeof requiredAiRoutes)[number];

			for (const route of requiredAiRoutes) {
				expect(routes.ai[route]).toBeDefined();
				expect(routes.ai[route]).toMatch(/^\/ai\//);
			}
		});
	});

	describe("Route Uniqueness", () => {
		it("should have unique route paths", () => {
			const paths = new Set<string>();
			const findPaths = (obj: Record<string, any>) => {
				for (const value of Object.values(obj)) {
					if (typeof value === "string") {
						// Skip external URLs and mailto links
						if (!value.startsWith("http") && !value.startsWith("mailto:")) {
							expect(paths.has(value)).toBeFalsy();
							paths.add(value);
						}
					} else if (typeof value === "object" && value !== null) {
						findPaths(value);
					}
				}
			};

			findPaths(routes);
		});
	});

	describe("Dynamic Route Parameters", () => {
		it("should have valid parameter format", () => {
			const findDynamicRoutes = (obj: Record<string, any>) => {
				for (const value of Object.values(obj)) {
					if (typeof value === "string") {
						// Check if route has parameters
						if (value.includes("/:")) {
							// Parameters should be in format /:paramName
							expect(value).toMatch(/\/:[a-zA-Z][a-zA-Z0-9]*/);
						}
					} else if (typeof value === "object" && value !== null) {
						findDynamicRoutes(value);
					}
				}
			};

			findDynamicRoutes(routes);
		});
	});
});
