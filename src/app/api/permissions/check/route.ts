import { auth } from "@/server/auth";
import { rbacService } from "@/server/services/rbac";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * API endpoint for checking permissions
 *
 * GET /api/permissions/check?resource=team&action=create&teamId=123
 */
export async function GET(req: NextRequest) {
	const session = await auth();

	if (!session?.user?.id) {
		return new NextResponse(null, {
			status: 401,
			statusText: "Unauthorized",
		});
	}

	const searchParams = req.nextUrl.searchParams;
	const resource = searchParams.get("resource");
	const action = searchParams.get("action");
	const teamId = searchParams.get("teamId");
	const projectId = searchParams.get("projectId");

	if (!resource || !action) {
		return new NextResponse(null, {
			status: 400,
			statusText: "Missing required parameters",
		});
	}

	const context = {
		...(teamId && { teamId }),
		...(projectId && { projectId }),
	};

	const hasPermission = await rbacService.hasPermission(
		session.user.id,
		resource,
		action,
		context,
	);

	if (!hasPermission) {
		return new NextResponse(null, {
			status: 403,
			statusText: "Forbidden",
		});
	}

	return new NextResponse(null, {
		status: 200,
		statusText: "OK",
	});
}
