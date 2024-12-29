import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session?.user) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		// Get the GitHub token from the user's accounts
		const githubAccount = await db.query.accounts.findFirst({
			where: (accounts, { and, eq }) =>
				and(
					eq(accounts.userId, session.user.id),
					eq(accounts.provider, "github"),
				),
		});

		if (!githubAccount?.access_token) {
			return new NextResponse("GitHub account not connected", { status: 400 });
		}

		const { template } = await request.json();

		const octokit = new Octokit({
			auth: githubAccount.access_token,
		});

		// Create repository from template
		const response = await octokit.repos.createUsingTemplate({
			template_owner: template.owner,
			template_repo: template.name,
			name: template.name,
			private: true,
			description: "My ShipKit instance",
		});

		return NextResponse.json({
			url: response.data.html_url,
			name: response.data.name,
			fullName: response.data.full_name,
		});
	} catch (error) {
		console.error("Error creating repository:", error);
		return new NextResponse(
			error instanceof Error ? error.message : "Failed to create repository",
			{ status: 500 },
		);
	}
}
