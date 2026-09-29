import path from "node:path";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

/*
 * Directory owned by fumadocs-mdx (see source.config.ts).
 *
 * @next/mdx must not touch it: its remark-frontmatter/remark-mdx-frontmatter
 * pair strips the YAML block and re-exports it as a `frontmatter` object, so
 * fumadocs' loader would receive a file with no frontmatter and reject every
 * page with "title: Required".
 */
const FUMADOCS_DIR = path.join(process.cwd(), "docs");

const MDX_TEST = /\.mdx?$/;

/** Minimal shape of the webpack rules this plugin needs to touch. */
interface WebpackRuleLike {
  test?: unknown;
  exclude?: unknown;
}

interface WebpackConfigLike {
  module?: { rules?: unknown[] };
}

/**
 * Applies MDX support to the Next.js config for app-level `.mdx` routes
 * (e.g. the legal pages). Documentation under /docs is compiled by fumadocs-mdx
 * instead and is explicitly excluded here.
 * @param nextConfig The existing Next.js configuration object.
 * @returns The modified Next.js configuration object with MDX support.
 */
export default function withMDXConfig(nextConfig: NextConfig): NextConfig {
  const withMDX = createMDX({
    extension: MDX_TEST,
    options: {
      remarkPlugins: [
        "remark-gfm",
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

  const config = withMDX(nextConfig);
  const previousWebpack = config.webpack;

  config.webpack = (webpackConfig, options) => {
    const result = (
      previousWebpack ? previousWebpack(webpackConfig, options) : webpackConfig
    ) as WebpackConfigLike;

    for (const entry of result.module?.rules ?? []) {
      if (!entry || typeof entry !== "object") continue;
      const rule = entry as WebpackRuleLike;
      if (!(rule.test instanceof RegExp) || rule.test.source !== MDX_TEST.source) continue;

      const existing = rule.exclude;
      rule.exclude = Array.isArray(existing)
        ? [...(existing as unknown[]), FUMADOCS_DIR]
        : existing
          ? [existing, FUMADOCS_DIR]
          : FUMADOCS_DIR;
    }

    return result;
  };

  return config;
}
