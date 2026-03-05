import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { deploymentService } from "@/server/services/deployment-service";

export async function GET(_request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const deployments = await deploymentService.getUserDeployments(
			session.user.id,
		);
		return NextResponse.json({ deployments });
	} catch (error) {
		console.error("Failed to fetch deployments:", error);
		return NextResponse.json(
			{ error: "Failed to fetch deployments" },
			{ status: 500 },
		);
	}
}
