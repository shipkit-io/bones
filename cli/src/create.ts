import * as p from "@clack/prompts";
import pc from "picocolors";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import {
  TEMPLATE_REPOS,
  UPSTREAM_REPOS,
  UPSTREAM_REMOTE,
} from "./constants.js";
import {
  run,
  runOrThrow,
  commandExists,
  canAccessRepo,
  isNonInteractive,
  validateProjectName,
  validateTemplateRepo,
} from "./utils.js";

export interface CreateOptions {
  yes?: boolean;
  template?: string;
  directory?: string;
  install?: boolean;
}

/**
 * Find the best accessible template repo.
 */
async function resolveTemplate(
  preferred?: string
): Promise<{ owner: string; name: string; label: string } | null> {
  if (preferred) {
    const err = validateTemplateRepo(preferred);
    if (err) {
      p.log.error(err);
      return null;
    }
    const parts = preferred.split("/");
    const accessible = await canAccessRepo(
      `https://github.com/${preferred}.git`
    );
    if (accessible)
      return { owner: parts[0], name: parts[1], label: preferred };
    p.log.warn(`Cannot access ${preferred}, trying defaults...`);
  }

  for (const repo of TEMPLATE_REPOS) {
    const url = `https://github.com/${repo.owner}/${repo.name}.git`;
    p.log.info(`Checking access to ${pc.cyan(repo.label)}...`);
    if (await canAccessRepo(url)) {
      p.log.success(`Using ${pc.green(repo.label)}`);
      return repo;
    }
    p.log.warn(`No access to ${repo.label}`);
  }

  return null;
}

/**
 * Find the best accessible upstream URL.
 */
async function resolveUpstream(): Promise<string | null> {
  for (const url of UPSTREAM_REPOS) {
    if (await canAccessRepo(url)) return url;
  }
  return null;
}

export async function create(
  projectName: string | undefined,
  opts: CreateOptions
): Promise<void> {
  const nonInteractive = opts.yes || isNonInteractive();

  p.intro(pc.bgCyan(pc.black(" create-shipkit ")));

  // --- Preflight checks ---
  const hasGh = await commandExists("gh");
  const hasGit = await commandExists("git");

  if (!hasGit) {
    p.log.error("git is required but not found on PATH.");
    process.exit(1);
  }

  // --- Project name ---
  let name = projectName;
  if (!name) {
    if (nonInteractive) {
      p.log.error("Project name is required in non-interactive mode.");
      process.exit(1);
    }
    const input = await p.text({
      message: "What is your project name?",
      placeholder: "my-shipkit-app",
      validate: validateProjectName,
    });
    if (p.isCancel(input)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }
    name = input;
  } else {
    const err = validateProjectName(name);
    if (err) {
      p.log.error(err);
      process.exit(1);
    }
  }

  // --- Target directory ---
  const targetDir = resolve(opts.directory || name);
  if (existsSync(targetDir)) {
    if (nonInteractive) {
      p.log.error(`Directory ${targetDir} already exists.`);
      process.exit(1);
    }
    const overwrite = await p.confirm({
      message: `Directory ${pc.yellow(targetDir)} already exists. Continue?`,
      initialValue: false,
    });
    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Cancelled.");
      process.exit(0);
    }
  }

  // --- Resolve template ---
  const template = await resolveTemplate(opts.template);
  if (!template) {
    p.log.error(
      "No accessible template repository found. Check your GitHub authentication."
    );
    process.exit(1);
  }

  const templateSlug = `${template.owner}/${template.name}`;

  // --- Confirm plan ---
  if (!nonInteractive) {
    const plan = await p.confirm({
      message: `Create ${pc.green(name)} from ${pc.cyan(templateSlug)} in ${pc.yellow(targetDir)}?`,
      initialValue: true,
    });
    if (p.isCancel(plan) || !plan) {
      p.cancel("Cancelled.");
      process.exit(0);
    }
  }

  // --- Create repo ---
  const s = p.spinner();
  const parentDir = resolve(targetDir, "..");

  if (hasGh) {
    // Use gh CLI to create from template (creates GitHub repo + clones)
    s.start("Creating repository from template...");
    const ghResult = await run(
      "gh",
      ["repo", "create", name, "--template", templateSlug, "--clone", "--public"],
      { cwd: parentDir }
    );

    if (ghResult === null) {
      s.stop("gh repo create failed, falling back to git clone...");
      // Fallback: plain clone
      await runOrThrow(
        "git",
        ["clone", `https://github.com/${templateSlug}.git`, targetDir]
      );
    } else {
      s.stop("Repository created on GitHub and cloned.");
    }
  } else {
    // No gh CLI — plain clone
    s.start("Cloning template...");
    await runOrThrow(
      "git",
      ["clone", `https://github.com/${templateSlug}.git`, targetDir]
    );
    s.stop("Template cloned.");
    p.log.info(
      `Tip: Install ${pc.cyan("gh")} CLI to auto-create a GitHub repo.`
    );
  }

  // --- Setup upstream remote ---
  s.start("Setting up upstream remote...");
  const upstreamUrl = await resolveUpstream();
  if (upstreamUrl) {
    const existing = await run("git", ["remote", "get-url", UPSTREAM_REMOTE], {
      cwd: targetDir,
    });
    if (existing) {
      await run("git", ["remote", "set-url", UPSTREAM_REMOTE, upstreamUrl], {
        cwd: targetDir,
      });
    } else {
      await run("git", ["remote", "add", UPSTREAM_REMOTE, upstreamUrl], {
        cwd: targetDir,
      });
    }
    s.stop(`Upstream remote set to ${pc.cyan(upstreamUrl)}`);
  } else {
    s.stop("No accessible upstream found (can be added later).");
  }

  // --- Graft upstream history ---
  if (upstreamUrl) {
    s.start("Grafting upstream history...");
    await run("git", ["fetch", UPSTREAM_REMOTE], { cwd: targetDir });
    const mergeBase = await run(
      "git",
      ["merge-base", "HEAD", `${UPSTREAM_REMOTE}/main`],
      { cwd: targetDir }
    );
    if (mergeBase === null) {
      // No common ancestor — graft
      const graft = await run(
        "git",
        [
          "merge",
          `${UPSTREAM_REMOTE}/main`,
          "--allow-unrelated-histories",
          "--no-edit",
          "-m",
          "chore: graft upstream template history",
        ],
        { cwd: targetDir }
      );
      if (graft !== null) {
        s.stop("Upstream history grafted.");
      } else {
        s.stop("History graft had conflicts — resolve manually.");
      }
    } else {
      s.stop("Histories already connected.");
    }
  }

  // --- Install dependencies ---
  const shouldInstall = opts.install !== false;
  if (shouldInstall) {
    const hasBun = await commandExists("bun");
    const pm = hasBun ? "bun" : "npm";
    s.start(`Installing dependencies with ${pm}...`);
    await run(pm, ["install"], { cwd: targetDir });
    s.stop("Dependencies installed.");
  }

  // --- Done ---
  p.outro(pc.green("✓ ShipKit project created!"));

  console.log();
  console.log(`  ${pc.bold("Next steps:")}`);
  console.log();
  console.log(`  ${pc.cyan("cd")} ${name}`);
  if (!shouldInstall) {
    console.log(`  ${pc.cyan("bun install")}`);
  }
  console.log(`  ${pc.cyan("cp")} .env.example .env`);
  console.log(`  ${pc.cyan("bun dev")}`);
  console.log();
  console.log(
    `  ${pc.dim("Sync upstream:")} ${pc.cyan("shipkit sync")}`
  );
  console.log(
    `  ${pc.dim("Deploy:")}         ${pc.cyan("shipkit deploy")}`
  );
  console.log();
}
