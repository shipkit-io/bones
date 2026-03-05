import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { teamService } from "@/server/services/team-service";

/**
 * GET /api/teams
 *
 * Get all teams for the current user.
 */
export async function GET(_request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const teams = await teamService.getUserTeams(session.user.id);
		return NextResponse.json({ teams });
	} catch (error) {
		console.error("Failed to fetch teams:", error);
		return NextResponse.json(
			{ error: "Failed to fetch teams" },
			{ status: 500 },
		);
	}
}
