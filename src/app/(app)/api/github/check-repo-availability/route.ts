import { type NextRequest, NextResponse } from "next/server";
import { rateLimits } from "@/config/rate-limits";
import { auth } from "@/server/auth";
import { deploymentService } from "@/server/services/deployment-service";
import { RateLimitService } from "@/server/services/rate-limit-service";

const rateLimitService = new RateLimitService();

/**
 * GET /api/github/check-repo-availability?name=my-project
 *
 * Check if a repository name is available on the user's GitHub account.
 * Rate limited to prevent abuse of GitHub API.
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ available: false, checked: false, error: "Authentication required" },
				{ status: 401 },
			);
		}

		// Rate limit: 30 checks per minute per user
		await rateLimitService.checkLimit(
			session.user.id,
			"checkRepoAvailability",
			rateLimits.deployments.status,
		);

		const searchParams = request.nextUrl.searchParams;
		const projectName = searchParams.get("name");

		if (!projectName) {
			return NextResponse.json(
				{ available: false, checked: false, error: "Project name is required" },
				{ status: 400 },
			);
		}

		const result = await deploymentService.checkRepositoryNameAvailable(
			session.user.id,
			projectName,
		);
		return NextResponse.json(result);
	} catch (error) {
		// Handle rate limit errors
		if (error instanceof Error && error.message.includes("Too many requests")) {
			return NextResponse.json(
				{ available: false, checked: false, error: "Rate limit exceeded" },
				{ status: 429 },
			);
		}
		console.error("Failed to check repository availability:", error);
		return NextResponse.json(
			{
				available: true,
				checked: false,
				error: "Failed to check availability",
			},
			{ status: 500 },
		);
	}
}
