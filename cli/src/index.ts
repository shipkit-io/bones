import { Command } from "commander";
import { create, type CreateOptions } from "./create.js";
import { sync, type SyncOptions } from "./sync.js";
import { deploy, type DeployOptions } from "./deploy.js";

const program = new Command()
  .name("shipkit")
  .description("Scaffold and manage ShipKit sites")
  .version("0.1.0");

program
  .command("create")
  .description("Create a new ShipKit project from template")
  .argument("[name]", "Project name")
  .option("-y, --yes", "Skip prompts (non-interactive mode)")
  .option("-t, --template <repo>", "Template repo (owner/name)")
  .option("-d, --directory <dir>", "Target directory")
  .option("--no-install", "Skip dependency installation")
  .action((name: string | undefined, opts: CreateOptions) => create(name, opts));

program
  .command("sync")
  .description("Sync changes from upstream ShipKit template")
  .option("-y, --yes", "Skip prompts (non-interactive mode)")
  .option("--direct", "Merge directly instead of creating a PR branch")
  .action((opts: SyncOptions) => sync(opts));

program
  .command("deploy")
  .description("Deploy your ShipKit site to Vercel")
  .option("-y, --yes", "Skip prompts (non-interactive mode)")
  .option("--open", "Open Vercel import page in browser")
  .action((opts: DeployOptions) => deploy(opts));

// Default: if no command given, run create
program.action((_opts, cmd) => {
  // If called as `create-shipkit <name>`, treat as create
  const args = cmd.args;
  if (args.length > 0) {
    return create(args[0], { yes: false });
  }
  program.help();
});

program.parse();
