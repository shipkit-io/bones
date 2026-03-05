import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { projectService } from "@/server/services/project-service";

/**
 * GET /api/projects?teamId=xxx
 *
 * Get all projects for a team.
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const teamId = searchParams.get("teamId");

		if (!teamId) {
			return NextResponse.json(
				{ error: "teamId is required" },
				{ status: 400 },
			);
		}

		const projects = await projectService.getTeamProjects(teamId);
		return NextResponse.json({ projects });
	} catch (error) {
		console.error("Failed to fetch projects:", error);
		return NextResponse.json(
			{ error: "Failed to fetch projects" },
			{ status: 500 },
		);
	}
}
