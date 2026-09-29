import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";

/*
 * Fumadocs content collections.
 *
 * Shipkit uses fumadocs *headlessly*: `fumadocs-mdx` compiles `docs/**` and
 * `fumadocs-core` supplies the page tree and search index, while the rendering
 * layer stays Shipkit's own components. `fumadocs-ui` is deliberately not used —
 * it requires Tailwind v4 (via @fumadocs/tailwind) and Shipkit is on v3.
 *
 * See src/config/docs-provider.ts for the fumadocs/holocron provider switch.
 */
export const docs = defineDocs({
  dir: "docs",
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      ...rehypeCodeDefaultOptions,
      /*
       * Shiki throws on unknown fence languages rather than degrading. The docs
       * use ```env for .env samples, which Shiki calls "dotenv"; the fallback
       * keeps any future unknown language from failing the build.
       */
      langs: [
        "bash",
        "typescript",
        "tsx",
        "javascript",
        "json",
        "yaml",
        "sql",
        "md",
        "mdx",
        "dotenv",
      ],
      langAlias: { env: "dotenv" },
      fallbackLanguage: "plaintext",
    },
  },
});
