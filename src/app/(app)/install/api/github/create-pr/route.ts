import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(req: Request) {
	try {
		const { branchName, baseBranch = "main", title, body } = await req.json();

		if (!branchName) {
			return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
		}

		if (!title) {
			return NextResponse.json({ error: "PR title is required" }, { status: 400 });
		}

		const octokit = new Octokit({
			auth: env.GITHUB_ACCESS_TOKEN,
		});

		// Create a new pull request
		const { data } = await octokit.pulls.create({
			owner: env.GITHUB_REPO_OWNER ?? "",
			repo: env.GITHUB_REPO_NAME ?? "",
			title,
			body: body || `Generated PR for Shadcn UI components.\n\nBranch: ${branchName}`,
			head: branchName,
			base: baseBranch,
			maintainer_can_modify: true,
		});

		return NextResponse.json({
			message: "Pull request created successfully",
			pull_number: data.number,
			html_url: data.html_url,
		});
	} catch (error) {
		console.error("Error creating PR:", error);
		return NextResponse.json(
			{
				error: "Failed to create pull request",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
