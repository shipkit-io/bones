import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// Webpack layer name for React Server Components (WEBPACK_LAYERS.reactServerComponents).
const RSC_LAYER = "rsc";

const matchesMdx = (test: unknown): boolean =>
	test instanceof RegExp && test.test("page.mdx");

const isSwcLoader = (
	entry: unknown,
): entry is { options: Record<string, unknown> } =>
	!!entry &&
	typeof entry === "object" &&
	typeof (entry as { loader?: unknown }).loader === "string" &&
	(entry as { loader: string }).loader.includes("next-swc-loader");

/**
 * Since 16.2.0, webpack builds compile .mdx pages without an RSC bundle layer,
 * so `export const metadata` from a page.mdx fails with "attempting to export
 * metadata from a component marked with 'use client'". Restore the layer on the
 * MDX swc-loader rule in the server compiler.
 * Remove once https://github.com/vercel/next.js/issues/91735 is fixed.
 */
const patchMdxRscLayer = (rules: unknown[]): void => {
	for (const rule of rules) {
		if (!rule || typeof rule !== "object") continue;
		const r = rule as Record<string, unknown>;

		if (matchesMdx(r.test)) {
			const uses = Array.isArray(r.use) ? r.use : [r.use];
			for (const entry of uses) {
				if (isSwcLoader(entry) && entry.options.bundleLayer == null) {
					entry.options.bundleLayer = RSC_LAYER;
				}
			}
		}

		if (Array.isArray(r.oneOf)) patchMdxRscLayer(r.oneOf);
		if (Array.isArray(r.rules)) patchMdxRscLayer(r.rules);
	}
};

/**
 * Applies MDX configuration to the Next.js config.
 * @param nextConfig The existing Next.js configuration object.
 * @returns The modified Next.js configuration object with MDX support.
 */
export function withMDXConfig(nextConfig: NextConfig): NextConfig {
	const withMDX = createMDX({
		extension: /\.mdx?$/,
		options: {
			remarkPlugins: [
				[
					"remark-frontmatter",
					{
						type: "yaml",
						marker: "-",
					},
				],
				["remark-mdx-frontmatter", {}],
			],
			rehypePlugins: [],
		},
	});

	const config = withMDX(nextConfig) as NextConfig;

	const prevWebpack = config.webpack;
	config.webpack = (webpackConfig, context) => {
		const resolved = prevWebpack
			? prevWebpack(webpackConfig, context)
			: webpackConfig;

		if (context.isServer && Array.isArray(resolved.module?.rules)) {
			patchMdxRscLayer(resolved.module.rules);
		}

		return resolved;
	};

	return config;
}
