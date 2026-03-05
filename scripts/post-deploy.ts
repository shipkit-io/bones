import { execSync } from "child_process";

async function postDeploy() {
	console.log("🚀 Running post-deployment tasks...");

	try {
		// Sync database
		console.log("🔄 Syncing database...");
		execSync("bun run db:sync", { stdio: "inherit" });

		console.log("✨ Post-deployment tasks completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error in post-deployment tasks:", error);
		process.exit(1);
	}
}

void postDeploy();
