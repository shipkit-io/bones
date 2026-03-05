#!/usr/bin/env node
/**
 * Patch Payload CMS packages to fix non-JS import issues in Node.js ESM
 *
 * This script removes style/asset imports from Payload packages that cause
 * ERR_UNKNOWN_FILE_EXTENSION errors at runtime on Vercel serverless.
 * The assets are already bundled separately by Payload/webpack for the browser.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Directories to patch
const dirsToPath = [
  "node_modules/@payloadcms/ui/dist",
  "node_modules/@payloadcms/richtext-lexical/dist",
  "node_modules/@payloadcms/plugin-cloud-storage/dist",
  "node_modules/@payloadcms/storage-s3/dist",
];

// File extensions that Node.js ESM cannot handle
const problematicExtensions =
  "css|scss|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|eot|ttf|otf";

// Patterns to match problematic imports (both formatted and minified)
const problematicImportPatterns = [
  // Style imports: import './something.scss';
  new RegExp(
    `import\\s+['"][^'"]*\\.(${problematicExtensions})['"];?\\n?`,
    "g",
  ),
  // Minified style imports: import"./something.scss";
  new RegExp(`import["'][^"']*\\.(${problematicExtensions})["'];?`, "g"),
  // Asset imports with variable: import something from './file.svg';
  new RegExp(
    `import\\s+(\\w+)\\s+from\\s+['"][^'"]*\\.(${problematicExtensions})['"];?\\n?`,
    "g",
  ),
  // Minified asset imports: import a from"./file.svg";
  new RegExp(
    `import\\s*(\\w+)\\s*from["'][^"']*\\.(${problematicExtensions})["'];?`,
    "g",
  ),
  // Re-export: export { default as name } from './file.svg';
  new RegExp(
    `export\\s*\\{\\s*default\\s+as\\s+(\\w+)\\s*\\}\\s*from\\s*['"][^'"]*\\.(${problematicExtensions})['"];?\\n?`,
    "g",
  ),
  // Minified re-export: export{default as name}from"./file.svg";
  new RegExp(
    `export\\s*\\{\\s*default\\s+as\\s+(\\w+)\\s*\\}\\s*from\\s*["'][^"']*\\.(${problematicExtensions})["'];?`,
    "g",
  ),
];

let patchedCount = 0;
let filesScanned = 0;

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, "utf-8");
  let originalContent = content;

  for (const pattern of problematicImportPatterns) {
    pattern.lastIndex = 0;
    content = content.replace(pattern, (match, varName) => {
      // For imports/exports that assign to a variable, replace with empty string
      if (varName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(varName)) {
        if (match.trimStart().startsWith("export")) {
          return `export const ${varName} = "";/* asset export removed */`;
        }
        return `const ${varName} = "";/* asset import removed */`;
      }
      return "/* style import removed */";
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      callback(fullPath);
    }
  }
}

console.log("[patch] Scanning Payload packages for problematic imports...");

for (const relDir of dirsToPath) {
  const dir = path.join(projectRoot, relDir);
  if (fs.existsSync(dir)) {
    console.log(`[patch] Scanning ${relDir}...`);
    walkDir(dir, (filePath) => {
      filesScanned++;
      if (patchFile(filePath)) {
        const relPath = path.relative(projectRoot, filePath);
        console.log(`[patch] Patched: ${relPath}`);
        patchedCount++;
      }
    });
  }
}

console.log(
  `[patch] Scanned ${filesScanned} files, patched ${patchedCount} file(s)`,
);

if (patchedCount > 0) {
  console.log(
    "[patch] Successfully removed problematic imports from Payload packages",
  );
} else {
  console.log("[patch] No problematic imports found to patch");
}
