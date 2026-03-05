import * as p from "@clack/prompts";
import pc from "picocolors";
import { UPSTREAM_REMOTE, UPSTREAM_REPOS } from "./constants.js";
import { run, runOrThrow, canAccessRepo, isNonInteractive } from "./utils.js";

export interface SyncOptions {
  yes?: boolean;
  direct?: boolean;
}

async function ensureUpstream(cwd: string): Promise<string | null> {
  // Check existing
  const existing = await run("git", ["remote", "get-url", UPSTREAM_REMOTE], { cwd });
  if (existing) return existing;

  // Try to add
  for (const url of UPSTREAM_REPOS) {
    if (await canAccessRepo(url)) {
      await run("git", ["remote", "add", UPSTREAM_REMOTE, url], { cwd });
      return url;
    }
  }
  return null;
}

export async function sync(opts: SyncOptions): Promise<void> {
  const nonInteractive = opts.yes || isNonInteractive();
  const cwd = process.cwd();

  p.intro(pc.bgCyan(pc.black(" shipkit sync ")));

  // Check we're in a git repo
  const isGit = await run("git", ["rev-parse", "--git-dir"], { cwd });
  if (isGit === null) {
    p.log.error("Not a git repository. Run this from your ShipKit project root.");
    process.exit(1);
  }

  // Ensure upstream
  const s = p.spinner();
  s.start("Checking upstream remote...");
  const upstream = await ensureUpstream(cwd);
  if (!upstream) {
    s.stop("No accessible upstream repository found.");
    process.exit(1);
  }
  s.stop(`Upstream: ${pc.cyan(upstream)}`);

  // Fetch
  s.start("Fetching upstream changes...");
  await runOrThrow("git", ["fetch", UPSTREAM_REMOTE], { cwd });
  s.stop("Fetched upstream.");

  // Check for changes
  const behind = await run(
    "git",
    ["rev-list", "--count", `HEAD..${UPSTREAM_REMOTE}/main`],
    { cwd }
  );
  if (behind === "0") {
    p.log.success("Already up to date with upstream.");
    p.outro("Nothing to do.");
    return;
  }

  p.log.info(`${pc.yellow(behind ?? "Unknown")} commits behind upstream.`);

  if (opts.direct) {
    // Direct merge into current branch
    if (!nonInteractive) {
      const confirm = await p.confirm({
        message: "Merge upstream changes directly into current branch?",
        initialValue: true,
      });
      if (p.isCancel(confirm) || !confirm) {
        p.cancel("Cancelled.");
        process.exit(0);
      }
    }

    s.start("Merging upstream changes...");
    const result = await run(
      "git",
      ["merge", `${UPSTREAM_REMOTE}/main`, "--no-edit"],
      { cwd }
    );
    if (result === null) {
      s.stop("Merge conflicts detected. Resolve manually and commit.");
      process.exit(1);
    }
    s.stop("Merged upstream changes.");
  } else {
    // Create a PR branch
    const branch = `sync-upstream-${Date.now()}`;

    s.start(`Creating sync branch ${pc.cyan(branch)}...`);
    await runOrThrow("git", ["checkout", "-b", branch], { cwd });

    const mergeResult = await run(
      "git",
      ["merge", `${UPSTREAM_REMOTE}/main`, "--no-edit"],
      { cwd }
    );
    if (mergeResult === null) {
      s.stop("Merge conflicts detected on sync branch. Resolve and commit.");
      process.exit(1);
    }

    await runOrThrow("git", ["push", "-u", "origin", branch], { cwd });
    s.stop("Sync branch pushed.");

    // Try to create PR via gh
    const ghPr = await run(
      "gh",
      [
        "pr", "create",
        "--title", "chore: sync upstream changes",
        "--body", "Automated sync from upstream.",
        "--base", "main",
        "--head", branch,
      ],
      { cwd }
    );
    if (ghPr) {
      p.log.success(`PR created: ${pc.cyan(ghPr)}`);
    } else {
      p.log.info(
        `Push complete. Create a PR from ${pc.cyan(branch)} → ${pc.cyan("main")} manually.`
      );
    }

    // Switch back to main
    await run("git", ["checkout", "main"], { cwd });
  }

  p.outro(pc.green("✓ Sync complete."));
}
