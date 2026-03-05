import { execa } from "execa";

/**
 * Run a shell command safely with args array. Returns stdout or null on failure.
 */
export async function run(
  cmd: string,
  args: string[],
  opts?: { cwd?: string }
): Promise<string | null> {
  try {
    const result = await execa(cmd, args, {
      cwd: opts?.cwd,
      reject: false,
    });
    if (result.exitCode !== 0) return null;
    return result.stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Run a shell command safely with args array, throw on failure. Returns stdout.
 */
export async function runOrThrow(
  cmd: string,
  args: string[],
  opts?: { cwd?: string }
): Promise<string> {
  const result = await execa(cmd, args, { cwd: opts?.cwd });
  return result.stdout.trim();
}

/**
 * Check if a command exists on PATH.
 */
export async function commandExists(cmd: string): Promise<boolean> {
  const result = await run("which", [cmd]);
  return result !== null;
}

/**
 * Check if a git remote repo is accessible.
 */
export async function canAccessRepo(url: string): Promise<boolean> {
  const result = await run("git", ["ls-remote", url]);
  return result !== null;
}

/**
 * Detect if running non-interactively (CI, piped, or agent).
 */
export function isNonInteractive(): boolean {
  return (
    !process.stdout.isTTY ||
    !!process.env.CI ||
    !!process.env.OPENCLAW ||
    !!process.env.SHIPKIT_NON_INTERACTIVE
  );
}

/**
 * Validate a project name (lowercase, numbers, hyphens, underscores, dots).
 */
export function validateProjectName(name: string): string | undefined {
  if (!name) return "Project name is required";
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name))
    return "Must start with a letter/number and contain only lowercase letters, numbers, hyphens, underscores, dots";
  if (name.length > 100) return "Must be 100 characters or fewer";
  return undefined;
}

/**
 * Validate a template repo string (owner/name format).
 */
export function validateTemplateRepo(repo: string): string | undefined {
  if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(repo))
    return "Template must be in format 'owner/repo'";
  return undefined;
}

/**
 * Open a URL in the default browser (cross-platform).
 */
export async function openUrl(url: string): Promise<void> {
  const platform = process.platform;
  if (platform === "darwin") {
    await run("open", [url]);
  } else if (platform === "win32") {
    await run("cmd", ["/c", "start", url]);
  } else {
    await run("xdg-open", [url]);
  }
}
