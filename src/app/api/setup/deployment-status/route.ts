import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const session = await auth();
		if (!session?.user) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const deploymentId = searchParams.get("id");

		if (!deploymentId) {
			return new NextResponse("Deployment ID required", { status: 400 });
		}

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

		// Get deployment status
		const statusResponse = await fetch(
			`https://api.vercel.com/v6/deployments/${deploymentId}`,
			{
				headers: {
					Authorization: `Bearer ${vercelAccount.access_token}`,
				},
			}
		);

		if (!statusResponse.ok) {
			const error = await statusResponse.text();
			console.error("Error getting deployment status:", error);
			return new NextResponse("Failed to get deployment status", {
				status: 500,
			});
		}

		const { state, url } = await statusResponse.json();

		// Map Vercel states to our states
		let status: "building" | "deploying" | "ready" | "error";
		switch (state) {
			case "BUILDING":
				status = "building";
				break;
			case "DEPLOYING":
				status = "deploying";
				break;
			case "READY":
				status = "ready";
				break;
			case "ERROR":
				status = "error";
				break;
			default:
				status = "building";
		}

		return NextResponse.json({ status, url });
	} catch (error) {
		console.error("Error checking deployment status:", error);
		return new NextResponse(
			error instanceof Error
				? error.message
				: "Failed to check deployment status",
			{ status: 500 }
		);
	}
}
