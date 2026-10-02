import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the two repo-shape facts that kept Dependabot from ever opening a
 * dependency PR on bones through September 2026 (LAC-4109).
 *
 * 1. One root lockfile. The repo is pnpm (packageManager, vercel.json's
 *    installCommand, CLAUDE.md), but a stale bun.lock sat beside
 *    pnpm-lock.yaml. scripts/verify.sh chooses its package manager by lockfile
 *    presence and prefers bun, so the local verify gate ran the wrong manager
 *    against a lockfile it had not written.
 *
 * 2. pnpm's minimum-release-age matches Dependabot's. Dependabot's updater runs
 *    pnpm behind a three-day release-age gate. When package.json carries a
 *    range whose only satisfying versions are younger than that gate, pnpm
 *    cannot resolve the manifest at all, and the job fails on *every*
 *    dependency with ERR_PNPM_NO_MATURE_MATCHING_VERSION. That is what
 *    `motion: ^13.3.0` (Sep 16) and `fumadocs-core: ^16.15.17` (Oct 1) did:
 *    both floors were written a day or two after those versions shipped.
 *    Holding pnpm to the same gate means pnpm cannot write such a floor.
 *
 * Deliberately offline and time-independent. Checking every range against the
 * live registry would be the direct assertion, but its verdict changes by the
 * hour as versions mature, which is a flaky test, not a guard.
 */
const ROOT = process.cwd();

// Minutes. Must equal the gate Dependabot's updater applies to pnpm.
const DEPENDABOT_RELEASE_AGE_GATE_MINUTES = 4320;

const OTHER_JS_LOCKFILES = ["bun.lock", "bun.lockb", "package-lock.json", "yarn.lock"];

describe("dependency resolution matches what Dependabot can resolve", () => {
  it("keeps pnpm-lock.yaml as the only root JS lockfile", () => {
    expect(existsSync(join(ROOT, "pnpm-lock.yaml"))).toBe(true);
    const strays = OTHER_JS_LOCKFILES.filter((name) => existsSync(join(ROOT, name)));
    expect(strays).toEqual([]);
  });

  it("holds pnpm to Dependabot's release-age gate", () => {
    const npmrc = readFileSync(join(ROOT, ".npmrc"), "utf8");
    const match = /^\s*minimum-release-age\s*=\s*(\d+)\s*$/m.exec(npmrc);

    expect(match, ".npmrc must set minimum-release-age").not.toBeNull();
    // Lower than the gate lets pnpm write a floor Dependabot cannot read.
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(DEPENDABOT_RELEASE_AGE_GATE_MINUTES);
  });
});
