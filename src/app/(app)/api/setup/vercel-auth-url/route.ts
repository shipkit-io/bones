import { NextResponse } from "next/server";
import { BASE_URL } from "@/config/base-url";
import { env } from "@/env";
import { auth } from "@/server/auth";

// Explicitly mark as dynamic to prevent caching of sensitive auth URLs
export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const session = await auth();
		if (!session?.user) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		// Generate a random state for CSRF protection
		const state = Math.random().toString(36).substring(7);

		// Store state in session or database for verification
		// This is a simplified example - you should implement proper state storage

		// Construct OAuth URL
		const params = new URLSearchParams({
			client_id: env.VERCEL_CLIENT_ID ?? "",
			redirect_uri: `${BASE_URL}/api/setup/vercel-callback`,
			scope: "user team",
			state,
		} satisfies Record<string, string>);

		const url = `https://vercel.com/oauth/authorize?${params.toString()}`;

		return NextResponse.json({ url });
	} catch (error) {
		console.error("Error generating Vercel auth URL:", error);
		return new NextResponse(
			error instanceof Error ? error.message : "Failed to generate auth URL",
			{ status: 500 }
		);
	}
}
