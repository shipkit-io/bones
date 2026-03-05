import { ViewTransitions } from "next-view-transitions";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { PageTracker } from "react-page-tracker";
import { KitProvider } from "@/components/providers/kit-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { ThemeProvider } from "@/components/ui/shipkit/theme";
import { auth } from "@/server/auth";
import { teamService } from "@/server/services/team-service";

/**
 * Root layout component that wraps the entire application
 * Uses KitProvider to manage all core providers
 */
export async function AppRouterLayout({
	children,
	themeProvider: ThemeProviderWrapper = ThemeProvider,
}: {
	children: ReactNode;
	themeProvider?: typeof ThemeProvider;
}) {
	// Fetch user teams if authenticated
	const session = await auth();
	let userTeams = [{ id: "personal", name: "Personal" }];

	if (session?.user?.id) {
		try {
			const teams = await teamService.getUserTeams(session.user.id);
			if (teams && teams.length > 0) {
				userTeams = teams.map((tm) => ({
					id: tm.team.id,
					name: tm.team.name,
				}));
			} else {
				// Ensure at least one personal team exists
				const personalTeam = await teamService.ensureOnePersonalTeam(session.user.id);
				if (personalTeam?.id && personalTeam?.name) {
					userTeams = [
						{
							id: personalTeam.id,
							name: personalTeam.name,
						},
					];
				}
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Failed to fetch user teams:", error);
		}
	}
	return (
		<ViewTransitions>
			{/* PageTracker - Track page views */}
			<PageTracker />

			{/* ThemeProvider should wrap providers that might need theme context */}
			<ThemeProviderWrapper>
				{/* KitProvider - Manage all core providers */}
				<KitProvider>
					<NuqsAdapter>
						<TeamProvider initialTeams={userTeams}>{children}</TeamProvider>
					</NuqsAdapter>
				</KitProvider>
			</ThemeProviderWrapper>
		</ViewTransitions>
	);
}
