import createMDX from "@next/mdx";
import type { NextConfig } from "next";

/**
 * Applies PWA configuration to the Next.js config.
 * @param nextConfig The existing Next.js configuration object.
 * @returns The modified Next.js configuration object with PWA support.
 */
export default function withMDXConfig(nextConfig: NextConfig): NextConfig {
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
	return withMDX(nextConfig);
}
