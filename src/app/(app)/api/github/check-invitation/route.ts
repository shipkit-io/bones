import { type NextRequest, NextResponse } from "next/server";
import { rateLimits } from "@/config/rate-limits";
import { auth } from "@/server/auth";
import { deploymentService } from "@/server/services/deployment-service";
import { RateLimitService } from "@/server/services/rate-limit-service";

const rateLimitService = new RateLimitService();

/**
 * GET /api/github/check-invitation
 *
 * Check if the current user has a pending GitHub invitation to the template repository.
 * Rate limited to prevent abuse of GitHub API.
 */
export async function GET(_request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ hasPendingInvitation: false, error: "Authentication required" },
				{ status: 401 },
			);
		}

		// Rate limit: 30 checks per minute per user
		await rateLimitService.checkLimit(
			session.user.id,
			"checkGitHubInvitation",
			rateLimits.deployments.status,
		);

		const result = await deploymentService.checkPendingGitHubInvitation(
			session.user.id,
		);
		return NextResponse.json(result);
	} catch (error) {
		// Handle rate limit errors
		if (error instanceof Error && error.message.includes("Too many requests")) {
			return NextResponse.json(
				{ hasPendingInvitation: false, error: "Rate limit exceeded" },
				{ status: 429 },
			);
		}
		console.error("Failed to check GitHub invitation:", error);
		return NextResponse.json(
			{
				hasPendingInvitation: false,
				error: "Failed to check invitation status",
			},
			{ status: 500 },
		);
	}
}
