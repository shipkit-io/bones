"use server";

import { routes } from "@/config/routes";
import { logger } from "@/lib/logger";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

/**
 * Server action to handle the repository download request.
 * This is a two-step process:
 * 1. Verify authentication and authorization
 * 2. Redirect to the download route handler which will stream the file
 *
 * Using redirect() instead of returning Response objects avoids
 * serialization issues between Server and Client Components.
 */
export async function downloadRepo() {
	const session = await auth();

	if (!session?.user?.id) {
		logger.warn("Unauthorized download attempt");
		redirect(routes.auth.signIn);
	}

	// Redirect to the download route handler
	redirect("/api/download");
}
