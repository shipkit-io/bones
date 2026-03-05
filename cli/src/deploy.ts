import * as p from "@clack/prompts";
import pc from "picocolors";
import { execa } from "execa";
import { run, commandExists, isNonInteractive, openUrl } from "./utils.js";

export interface DeployOptions {
  yes?: boolean;
  open?: boolean;
}

export async function deploy(opts: DeployOptions): Promise<void> {
  const nonInteractive = opts.yes || isNonInteractive();
  const cwd = process.cwd();

  p.intro(pc.bgCyan(pc.black(" shipkit deploy ")));

  // Check we're in a git repo with a remote
  const origin = await run("git", ["remote", "get-url", "origin"], { cwd });
  if (!origin) {
    p.log.error("No git origin remote. Push your repo to GitHub first.");
    process.exit(1);
  }

  // Extract owner/repo from origin URL
  const match = origin.match(/github\.com[:/]([a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+?)(?:\.git)?$/);
  if (!match) {
    p.log.error(`Could not parse GitHub repo from origin: ${origin}`);
    process.exit(1);
  }
  const repoSlug = match[1];

  // Option 1: Vercel CLI
  const hasVercel = await commandExists("vercel");
  if (hasVercel) {
    if (!nonInteractive) {
      const method = await p.select({
        message: "How would you like to deploy?",
        options: [
          { value: "vercel-cli", label: "Vercel CLI (deploy now)" },
          { value: "vercel-web", label: "Vercel Web (open import page)" },
          {
            value: "github-action",
            label: "GitHub Action (trigger deploy workflow)",
          },
        ],
      });

      if (p.isCancel(method)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }

      if (method === "vercel-cli") {
        p.log.info("Running Vercel CLI...");
        await execa("vercel", ["--prod"], {
          cwd,
          stdio: "inherit",
        });
        p.outro(pc.green("✓ Deployed."));
        return;
      }

      if (method === "vercel-web") {
        const url = `https://vercel.com/new/import?s=https://github.com/${repoSlug}`;
        p.log.info(`Open: ${pc.cyan(url)}`);
        await openUrl(url);
        p.outro("Opening Vercel import page...");
        return;
      }

      if (method === "github-action") {
        return triggerGitHubDeploy(repoSlug, cwd);
      }
    } else {
      // Non-interactive: just deploy with Vercel CLI
      p.log.info("Deploying with Vercel CLI (non-interactive)...");
      await execa("vercel", ["--prod", "--yes"], {
        cwd,
        stdio: "inherit",
      });
      p.outro(pc.green("✓ Deployed."));
      return;
    }
  }

  // No Vercel CLI — try GitHub Action or open web
  const hasGh = await commandExists("gh");
  if (hasGh) {
    return triggerGitHubDeploy(repoSlug, cwd);
  }

  // Fallback: open Vercel import
  const url = `https://vercel.com/new/import?s=https://github.com/${repoSlug}`;
  p.log.info(`Deploy via Vercel: ${pc.cyan(url)}`);
  await openUrl(url);
  p.outro("Opening Vercel import page...");
}

async function triggerGitHubDeploy(
  repoSlug: string,
  cwd: string
): Promise<void> {
  const s = p.spinner();
  s.start("Triggering deploy-to-production workflow...");
  const result = await run(
    "gh",
    ["workflow", "run", "deploy-to-production.yml", "--repo", repoSlug],
    { cwd }
  );
  if (result !== null) {
    s.stop("Deploy workflow triggered.");
    p.log.info(
      `Monitor: ${pc.cyan(`https://github.com/${repoSlug}/actions`)}`
    );
  } else {
    s.stop("Could not trigger workflow (missing workflow or permissions).");
    const url = `https://vercel.com/new/import?s=https://github.com/${repoSlug}`;
    p.log.info(`Deploy manually: ${pc.cyan(url)}`);
  }
  p.outro(pc.green("✓ Done."));
}
