import type { Metadata } from "next";
import { DashboardTabs } from "@/app/(app)/(dashboard)/_components/dashboard-tabs";
import { DownloadSection } from "@/app/(app)/(dashboard)/_components/download-section";
import { QuickActions } from "@/app/(app)/(dashboard)/_components/quick-actions";
import { RecentActivity } from "@/app/(app)/(dashboard)/_components/recent-activity";
import { StatsCards } from "@/app/(app)/(dashboard)/_components/stats-cards";
import { OnboardingCheck } from "@/components/modules/onboarding/onboarding-check";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { Badge } from "@/components/ui/badge";
import { constructMetadata } from "@/config/metadata";
import { useDashboardData } from "./_hooks/use-dashboard-data";

export const metadata: Metadata = constructMetadata({
	title: "Dashboard",
	description: "View your project overview, recent activity, and quick actions from your personalized dashboard.",
});

export default async function DashboardPage() {
	const {
		session,
		isUserAdmin,
		hasGitHubConnection,
		githubUsername,
		hasVercelConnection,
		isCustomer,
		isSubscribed,
	} = await useDashboardData();

	return (
		<div className="container mx-auto py-6 space-y-4">
			<OnboardingCheck
				user={session.user}
				hasGitHubConnection={hasGitHubConnection}
				hasVercelConnection={hasVercelConnection}
				githubUsername={githubUsername}
				hasPurchased={isCustomer || isUserAdmin}
				forceEnabled={isUserAdmin}
			/>

			<PageHeader>
				<div className="w-full flex flex-wrap items-center justify-between gap-2">
					<div>
						<div className="flex items-center gap-2">
							<PageHeaderHeading>
								Hello, {session.user.name ?? session.user.email ?? "friend"}
							</PageHeaderHeading>
							{isCustomer && (
								<Badge variant="outline" className="whitespace-nowrap">
									Customer
								</Badge>
							)}

							{isSubscribed && (
								<Badge variant="outline" className="whitespace-nowrap">
									Active Subscription
								</Badge>
							)}

							{isUserAdmin && (
								<Badge variant="outline" className="whitespace-nowrap">
									Admin
								</Badge>
							)}
						</div>
						<PageHeaderDescription>
							Check out what's happening with your projects
						</PageHeaderDescription>
					</div>
					<DownloadSection isCustomer={isCustomer || isUserAdmin} />
				</div>
			</PageHeader>

			<StatsCards />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<RecentActivity />
			</div>
			<QuickActions />
			<DashboardTabs hasGitHubConnection={hasGitHubConnection} />
		</div>
	);
}
