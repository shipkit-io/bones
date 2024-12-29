import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(request: Request) {
	try {
		const session = await auth();
		if (!session?.user) {
			return new Response(
				`
                <script>
                    window.opener.postMessage(
                        { type: "vercel-oauth-error", error: "Unauthorized" },
                        window.location.origin
                    );
                    window.close();
                </script>
                `,
				{
					headers: { "Content-Type": "text/html" },
				}
			);
		}

		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		if (error) {
			return new Response(
				`
                <script>
                    window.opener.postMessage(
                        { type: "vercel-oauth-error", error: "${error}" },
                        window.location.origin
                    );
                    window.close();
                </script>
                `,
				{
					headers: { "Content-Type": "text/html" },
				}
			);
		}

		if (!code) {
			return new Response(
				`
                <script>
                    window.opener.postMessage(
                        { type: "vercel-oauth-error", error: "No code provided" },
                        window.location.origin
                    );
                    window.close();
                </script>
                `,
				{
					headers: { "Content-Type": "text/html" },
				}
			);
		}

		// Verify state here (omitted for brevity)

		// Exchange code for access token
		const tokenResponse = await fetch(
			"https://api.vercel.com/v2/oauth/access_token",
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					client_id: process.env.VERCEL_CLIENT_ID!,
					client_secret: process.env.VERCEL_CLIENT_SECRET!,
					code,
					redirect_uri: `${process.env.NEXTAUTH_URL}/api/setup/vercel-callback`,
				}),
			}
		);

		if (!tokenResponse.ok) {
			const error = await tokenResponse.text();
			return new Response(
				`
                <script>
                    window.opener.postMessage(
                        { type: "vercel-oauth-error", error: "Failed to exchange code for token" },
                        window.location.origin
                    );
                    window.close();
                </script>
                `,
				{
					headers: { "Content-Type": "text/html" },
				}
			);
		}

		const { access_token, team_id } = await tokenResponse.json();

		// Store the access token and team ID
		await db.query.accounts.upsert({
			where: (accounts, { and, eq }) =>
				and(
					eq(accounts.userId, session.user.id),
					eq(accounts.provider, "vercel")
				),
			set: {
				access_token,
				team_id,
				provider: "vercel",
				userId: session.user.id,
				type: "oauth",
			},
		});

		// Return success response
		return new Response(
			`
            <script>
                window.opener.postMessage(
                    { type: "vercel-oauth-success" },
                    window.location.origin
                );
                window.close();
            </script>
            `,
			{
				headers: { "Content-Type": "text/html" },
			}
		);
	} catch (error) {
		console.error("Error in Vercel OAuth callback:", error);
		return new Response(
			`
            <script>
                window.opener.postMessage(
                    { type: "vercel-oauth-error", error: "Internal server error" },
                    window.location.origin
                );
                window.close();
            </script>
            `,
			{
				headers: { "Content-Type": "text/html" },
			}
		);
	}
}
