/**
 * Generates src/config/providers/index.tsx from the `*.provider.tsx` files in
 * that directory, the same way `src/config/with-plugins.ts` collects
 * `src/config/nextjs/*` for next.config.ts.
 *
 * Each provider file default-exports a component that takes `children`.
 * Registry items add a provider by dropping a file here; nothing patches the
 * root layout. Runs from the `predev` and `prebuild` scripts.
 *
 * Pure Node, no dependencies, so it runs before `pnpm install` finishes
 * resolving anything. Node 22.18+ runs .ts directly.
 */

import fs from "node:fs";
import path from "node:path";

const PROVIDERS_DIR_RELATIVE = "src/config/providers";
const PROVIDER_FILE_PATTERN = /\.provider\.tsx$/;

const providersDir = path.join(process.cwd(), PROVIDERS_DIR_RELATIVE);
const outputPath = path.join(providersDir, "index.tsx");

const toPascalCase = (value: string): string =>
  value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const providerFiles = fs.existsSync(providersDir)
  ? fs
      .readdirSync(providersDir)
      .filter((file) => PROVIDER_FILE_PATTERN.test(file))
      .sort() // Mount providers in alphabetical order, outermost first
  : [];

const providers = providerFiles.map((file) => {
  const base = file.replace(PROVIDER_FILE_PATTERN, "");
  return { file, importName: `${toPascalCase(base)}Provider`, specifier: `./${base}.provider` };
});

const header = `/**
 * GENERATED FILE. Do not edit by hand.
 *
 * Built by scripts/generate-providers.ts from every \`*.provider.tsx\` file in
 * this directory (\`predev\` and \`prebuild\` run it). Add a provider by adding a
 * file; never edit this index. Mounted once in
 * src/components/layouts/root-layout.tsx.
 */
`;

const imports = providers.map((p) => `import ${p.importName} from "${p.specifier}";`).join("\n");

// Nested one level per line so the output already matches Prettier's layout.
const indent = (depth: number) => "  ".repeat(depth + 1);
const tree = providers
  .map((p, i) => {
    const isInnermost = i === providers.length - 1;
    return isInnermost
      ? `${indent(i)}<${p.importName}>{children}</${p.importName}>`
      : `${indent(i)}<${p.importName}>`;
  })
  .concat(
    providers
      .slice(0, -1)
      .map((p, i) => `${indent(i)}</${p.importName}>`)
      .reverse()
  )
  .join("\n");

const body =
  providers.length === 0
    ? `import type { ReactNode } from "react";

/**
 * No providers are installed. Registry items add \`*.provider.tsx\` files here
 * and the generator composes them.
 */
export const Providers = ({ children }: { children: ReactNode }) => <>{children}</>;
`
    : `import type { ReactNode } from "react";
${imports}

export const Providers = ({ children }: { children: ReactNode }) => (
${tree}
);
`;

const output = `${header}\n${body}`;

if (!fs.existsSync(providersDir)) {
  fs.mkdirSync(providersDir, { recursive: true });
}

const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
if (current !== output) {
  fs.writeFileSync(outputPath, output);
  console.info(
    `[providers] wrote ${PROVIDERS_DIR_RELATIVE}/index.tsx with ${providers.length} provider(s)` +
      (providers.length ? `: ${providers.map((p) => p.file).join(", ")}` : "")
  );
}
