/**
 * Post-build smoke test.
 *
 * Starts the production server, hits critical routes, and exits non-zero
 * if any return a 5xx. Run after `next build` to catch runtime errors
 * that the build step misses (missing modules, bad imports, etc.).
 *
 * Works on any hosting platform — not Vercel-specific.
 *
 * Environment variables:
 *   SMOKE_TEST_PORT     — port to start the server on (default: 3847)
 *   SMOKE_TEST_TIMEOUT  — ms to wait for server startup (default: 30000)
 *   SKIP_SMOKE_TEST     — set to "true" to skip (exits 0)
 *
 * Usage:
 *   npx tsx scripts/smoke-test.ts
 *   npx tsx scripts/smoke-test.ts /custom/route /another/route
 */

import { type ChildProcess, spawn } from "node:child_process";
import http from "node:http";

// Allow opt-out for environments where smoke testing isn't desired
if (process.env.SKIP_SMOKE_TEST === "true") {
  console.log("⏭️  Smoke test skipped (SKIP_SMOKE_TEST=true)");
  process.exit(0);
}

const PORT = Number(process.env.SMOKE_TEST_PORT) || 3847;
const TIMEOUT_MS = Number(process.env.SMOKE_TEST_TIMEOUT) || 30_000;
const DEFAULT_ROUTES = ["/"];

const routes = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_ROUTES;

function waitForServer(port: number, timeoutMs: number): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Server did not start within ${timeoutMs}ms`));
        } else {
          setTimeout(check, 300);
        }
      });
      req.end();
    };
    check();
  });
}

function checkRoute(port: number, route: string): Promise<{ route: string; status: number }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}${route}`, (res) => {
      res.resume();
      resolve({ route, status: res.statusCode ?? 0 });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(10_000, () => {
      req.destroy();
      reject(new Error(`Request to ${route} timed out`));
    });
    req.end();
  });
}

async function main() {
  console.log(`\n🔥 Smoke test: starting server on port ${PORT}...`);

  const server: ChildProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "pipe",
    env: { ...process.env, NODE_ENV: "production" },
  });

  // Forward server stderr for debugging
  server.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.error(`  [server] ${msg}`);
  });

  const cleanup = () => {
    server.kill("SIGTERM");
    // Force kill after 3s if it doesn't exit
    setTimeout(() => server.kill("SIGKILL"), 3000);
  };

  try {
    await waitForServer(PORT, TIMEOUT_MS);
    console.log(`✅ Server is up on port ${PORT}`);

    const results = await Promise.all(routes.map((r) => checkRoute(PORT, r)));
    let failed = false;

    for (const { route, status } of results) {
      if (status >= 500) {
        console.error(`❌ ${route} → ${status}`);
        failed = true;
      } else {
        console.log(`✅ ${route} → ${status}`);
      }
    }

    cleanup();

    if (failed) {
      console.error("\n💥 Smoke test FAILED — server returned 5xx on one or more routes.\n");
      process.exit(1);
    }

    console.log("\n🎉 Smoke test passed.\n");
    process.exit(0);
  } catch (err) {
    cleanup();
    console.error(`\n💥 Smoke test error: ${err}`);
    process.exit(1);
  }
}

main();
