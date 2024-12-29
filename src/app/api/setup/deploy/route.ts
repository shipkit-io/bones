import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session?.user) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { repoUrl, teamId, projectName } = await request.json();

		// Get Vercel access token
		const vercelAccount = await db.query.accounts.findFirst({
			where: (accounts, { and, eq }) =>
				and(
					eq(accounts.userId, session.user.id),
					eq(accounts.provider, "vercel")
				),
		});

		if (!vercelAccount?.access_token) {
			return new NextResponse("Vercel account not connected", { status: 400 });
		}

		// Create project on Vercel
		const createProjectResponse = await fetch(
			"https://api.vercel.com/v9/projects",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${vercelAccount.access_token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: projectName,
					gitRepository: {
						type: "github",
						repo: repoUrl.split("github.com/")[1],
					},
					framework: "nextjs",
				}),
			}
		);

		if (!createProjectResponse.ok) {
			const error = await createProjectResponse.text();
			console.error("Error creating Vercel project:", error);
			return new NextResponse("Failed to create Vercel project", {
				status: 500,
			});
		}

		const { id: projectId } = await createProjectResponse.json();

		// Deploy the project
		const deployResponse = await fetch(
			"https://api.vercel.com/v6/deployments",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${vercelAccount.access_token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: projectName,
					project: projectId,
					target: "production",
					teamId,
					gitSource: {
						type: "github",
						ref: "main",
						repoId: repoUrl.split("github.com/")[1],
					},
				}),
			}
		);

		if (!deployResponse.ok) {
			const error = await deployResponse.text();
			console.error("Error deploying to Vercel:", error);
			return new NextResponse("Failed to deploy to Vercel", { status: 500 });
		}

		const { id: deploymentId } = await deployResponse.json();

		return NextResponse.json({ deploymentId });
	} catch (error) {
		console.error("Error in deployment:", error);
		return new NextResponse(
			error instanceof Error ? error.message : "Failed to deploy",
			{ status: 500 }
		);
	}
}
