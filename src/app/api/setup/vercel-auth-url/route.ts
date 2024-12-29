import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

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
			client_id: env.VERCEL_CLIENT_ID,
			redirect_uri: `${env.AUTH_URL}/api/setup/vercel-callback`,
			scope: "user team",
			state,
		});

		const url = `https://vercel.com/oauth/authorize?${params.toString()}`;

		return NextResponse.json({ url });
	} catch (error) {
		console.error("Error generating Vercel auth URL:", error);
		return new NextResponse(
			error instanceof Error ? error.message : "Failed to generate auth URL",
			{ status: 500 },
		);
	}
}
