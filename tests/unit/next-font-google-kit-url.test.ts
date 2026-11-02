import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

/**
 * LAC-6442, from LAC-6432. A production build on a sibling repo went red for
 * three days on `src/config/fonts.ts`: `An error occurred in next/font` /
 * `TypeError: Cannot read properties of null (reading '1')`.
 *
 * Nothing in that repo changed. Google Fonts started answering one font
 * variant with its dynamic endpoint, `https://fonts.gstatic.com/l/font?kit=`,
 * which has no file extension in the path. next below 16.4.3 derived the
 * emitted file's extension straight off the URL with
 * `/\.(woff|woff2|eot|ttf|otf)$/.exec(url)[1]`, so an extensionless URL
 * dereferenced null and failed the whole build. This repo shipped 16.3.5 and
 * had the same unguarded line in node_modules. Fixed upstream in 16.4.3, which
 * reads the `format()` hint and falls back to woff2.
 *
 * The failure is invisible from here: which URL shape Google serves depends on
 * their side and on the requesting network, so a green local build proves
 * nothing. What this guards is the dependency floor — downgrading next below
 * 16.4.3, or an upstream revert, re-breaks production rather than this test.
 */
describe("next/font/google tolerates Google's extensionless font URLs", () => {
  const require = createRequire(path.join(repoRoot, "package.json"));
  const { findFontFilesInCss } =
    require("next/dist/compiled/@next/font/dist/google/find-font-files-in-css.js") as {
      findFontFilesInCss: (
        css: string,
        subsetsToPreload?: string[]
      ) => { googleFontFileUrl: string; preloadFontFile: boolean; ext?: string }[];
    };

  const kitUrl = "https://fonts.gstatic.com/l/font?kit=co3ZmX5slCNuHLi8bLeY9MK7&skey=a&v=v21";
  const staticUrl = "https://fonts.gstatic.com/s/inter/v20/UcC53FwrK3iLTcvneQg7.woff2";
  const css = [
    "/* latin */",
    "@font-face {",
    "  font-family: 'Noto Serif';",
    `  src: url(${kitUrl}) format('woff2');`,
    "}",
    "/* cyrillic */",
    "@font-face {",
    "  font-family: 'Inter';",
    `  src: url(${staticUrl}) format('woff2');`,
    "}",
  ].join("\n");

  it("resolves an extension for a /l/font?kit= URL", () => {
    const [kitFile] = findFontFilesInCss(css, ["latin"]);

    expect(kitFile.googleFontFileUrl).toBe(kitUrl);
    // next 16.3.5 read this off the URL path and threw on null.
    expect(kitFile.ext).toBe("woff2");
  });

  it("still resolves an extension from the URL path when there is one", () => {
    const staticFile = findFontFilesInCss(css, ["latin"]).find(
      (file) => file.googleFontFileUrl === staticUrl
    );

    expect(staticFile?.ext).toBe("woff2");
  });

  it("only matters while the site loads fonts from Google at build time", () => {
    const fonts = readFileSync(path.join(repoRoot, "src/config/fonts.ts"), "utf8");

    expect(fonts).toContain("next/font/google");
  });
});
