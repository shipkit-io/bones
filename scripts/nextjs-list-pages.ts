// scripts/list-static.js
// --------------------------------------------
// Usage:  node scripts/list-static.js
// (make sure you ran `next build` first!)

import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const nextDir = path.join(projectRoot, ".next");
const manifestPath = path.join(nextDir, "prerender-manifest.json");
const serverDir = path.join(nextDir, "server"); // pages or app live under here

// 1️⃣  Read the prerender manifest
let ssgRoutes = [];
let dynamicSsgRoutes = [];
try {
	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	ssgRoutes = Object.keys(manifest.routes);
	dynamicSsgRoutes = Object.keys(manifest.dynamicRoutes);
} catch (err) {
	console.error("❌ Can’t read prerender‑manifest.json – did you run `next build`?");
	process.exit(1);
}

// 2️⃣  Walk the .next/server directory for emitted HTML files
function walk(dir: string, acc: string[] = []): string[] {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, acc);
		else if (entry.isFile() && entry.name.endsWith(".html")) acc.push(full);
	}
	return acc;
}
const htmlFiles = walk(serverDir)
	// turn ".next/server/pages/about.html" → “/about”
	.map((f: string) => {
		const rel = f.replace(serverDir, "").replace(/\\/g, "/");
		return rel.replace(/\/index\.html$/, "/").replace(/\.html$/, "") || "/";
	})
	.sort();

console.log("\n📄 Static HTML files emitted:");
htmlFiles.forEach((p) => {
	console.log("  •", p);
});

console.log("\n📦 SSG routes from prerender‑manifest.json:");
ssgRoutes.forEach((p) => {
	console.log("  •", p);
});

if (dynamicSsgRoutes.length) {
	console.log("\n📦 Dynamic SSG routes (ISR/fallback):");
	dynamicSsgRoutes.forEach((p) => {
		console.log("  •", p);
	});
}

console.log("\n✅ Done.");
