/**
 * Debug page for auth issues
 * Only available in development mode
 */

import { notFound } from "next/navigation";
import { auth } from "@/server/auth";

export default async function AuthDebugPage() {
	// Only allow in development mode
	if (process.env.NODE_ENV === "production") {
		notFound();
	}

	const session = await auth();

	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>

			<div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-md">
				<p className="text-yellow-800 font-medium">
					This page is only available in development mode to help debug authentication issues.
				</p>
			</div>

			<div className="space-y-6">
				<section className="p-6 bg-white rounded-lg shadow-sm border">
					<h2 className="text-xl font-semibold mb-4">Session Status</h2>
					<div className="p-4 bg-slate-50 rounded-md">
						<pre className="whitespace-pre-wrap text-sm">
							{JSON.stringify(
								{
									authenticated: !!session?.user,
									user: session?.user
										? {
												id: session.user.id,
												name: session.user.name,
												email: session.user.email,
												emailVerified: session.user.emailVerified,
												image: session.user.image,
												bio: session.user.bio,
												githubUsername: session.user.githubUsername,
												hasPayloadToken: !!session.user.payloadToken,
												accounts: session.user.accounts,
											}
										: null,
								},
								null,
								2
							)}
						</pre>
					</div>
				</section>

				<section className="p-6 bg-white rounded-lg shadow-sm border">
					<h2 className="text-xl font-semibold mb-4">Authentication Troubleshooting</h2>

					<div className="space-y-4">
						<div>
							<h3 className="font-medium mb-2">Common Issues</h3>
							<ul className="list-disc list-inside space-y-2">
								<li>
									<span className="font-medium">Session not persisting after sign-in</span>
									<ul className="list-disc ml-6 mt-1 text-slate-600">
										<li>Check cookies configuration in auth.config.ts</li>
										<li>Ensure database session strategy is properly configured</li>
										<li>Verify the database adapter is working correctly</li>
										<li>Check for CSRF issues (sameSite, secure settings)</li>
									</ul>
								</li>
								<li>
									<span className="font-medium">OAuth sign-in not working</span>
									<ul className="list-disc ml-6 mt-1 text-slate-600">
										<li>Verify OAuth provider credentials</li>
										<li>Check callback URLs and permissions</li>
										<li>Ensure OAuth provider is enabled</li>
									</ul>
								</li>
								<li>
									<span className="font-medium">Credentials sign-in issues</span>
									<ul className="list-disc ml-6 mt-1 text-slate-600">
										<li>Check credentials provider configuration</li>
										<li>Verify user data is saved to both databases</li>
										<li>Ensure passwords are compared correctly</li>
									</ul>
								</li>
							</ul>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
