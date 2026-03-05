import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

/**
 * Checks for the existence of blog content and sets the NEXT_PUBLIC_HAS_BLOG environment variable.
 * @param nextConfig The existing Next.js configuration object.
 * @returns The modified Next.js configuration object.
 */
export default function withBlog(nextConfig: NextConfig): NextConfig {
    const blogContentPath = path.join(process.cwd(), "src/content/blog");
    let hasBlog = false;
    try {
        const blogFiles = fs.readdirSync(blogContentPath);
        if (
            blogFiles.some(
                (file) => file.endsWith(".mdx") || file.endsWith(".md"),
            )
        ) {
            hasBlog = true;
        }
    } catch (error) {
        // If the directory doesn't exist, we can ignore the error.
    }

    const existingEnv = nextConfig.env ?? {};

    return {
        ...nextConfig,
        env: {
            ...existingEnv,
            NEXT_PUBLIC_HAS_BLOG: String(hasBlog),
        },
    };
}
