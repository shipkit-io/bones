import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataTable } from "@/components/ui/data-table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { constructMetadata } from "@/config/metadata";
import { safeDbExecute } from "@/server/db";
import { users } from "@/server/db/schema";
import { getCollaboratorDetails } from "@/server/services/github/github-service";
import { columns, type GitHubUserData } from "./_components/columns";
import RepoInfo, { RepoInfoSkeleton } from "./_components/repo-info";
import RepoMetrics, { RepoMetricsSkeleton } from "./_components/repo-metrics";

export const metadata: Metadata = constructMetadata({
	title: "GitHub Integration",
	description: "Manage GitHub repository access and view connected users.",
	noIndex: true,
});

function GitHubUsersTableSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-10 w-[250px]" />
			<div className="rounded-md border">
				<div className="h-24 rounded-md" />
			</div>
		</div>
	);
}

async function GitHubUsersTableContent() {
	// Use safeDbExecute to handle database unavailability
	const githubUsers = await safeDbExecute(
		async (db) => {
			return await db.query.users.findMany({
				where: (users: any, { isNotNull }: any) => isNotNull(users.githubUsername),
				columns: {
					id: true,
					email: true,
					name: true,
					githubUsername: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		},
		[] // Return empty array if database is not available
	);

	// If no users found or database unavailable, show appropriate message
	if (githubUsers.length === 0) {
		return (
			<Alert>
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>No GitHub Users Found</AlertTitle>
				<AlertDescription>
					{githubUsers.length === 0
						? "No users with GitHub accounts found in the database."
						: "Database is not available. GitHub user information cannot be displayed."}
				</AlertDescription>
			</Alert>
		);
	}

	// Fetch GitHub details for each user and properly type the result
	const usersWithDetails: GitHubUserData[] = await Promise.all(
		githubUsers.map(async (user: (typeof githubUsers)[0]): Promise<GitHubUserData> => {
			if (!user.githubUsername) {
				return {
					...user,
					githubDetails: null,
				};
			}
			const details = await getCollaboratorDetails(user.githubUsername);
			return {
				...user,
				githubDetails: details,
			};
		})
	);

	return (
		<DataTable
			columns={columns}
			data={usersWithDetails}
			searchPlaceholder="Search GitHub users..."
		/>
	);
}

export default function GitHubUsersPage() {
	return (
		<div className="container mx-auto py-10">
			<PageHeader>
				<PageHeaderHeading>GitHub Integration</PageHeaderHeading>
				<PageHeaderDescription>
					Manage GitHub repository access and view connected users.
				</PageHeaderDescription>
			</PageHeader>

			{/* Repository Information Card */}
			<div className="mb-8">
				<Suspense fallback={<RepoInfoSkeleton />}>
					<RepoInfo />
				</Suspense>
			</div>

			{/* Repository Metrics */}
			<div className="mb-10">
				<h2 className="text-xl font-semibold tracking-tight mb-4">Repository Metrics</h2>
				<Suspense fallback={<RepoMetricsSkeleton />}>
					<RepoMetrics />
				</Suspense>
			</div>

			{/* GitHub Users Section */}
			<div className="mb-6">
				<h2 className="text-xl font-semibold tracking-tight">Repository Collaborators</h2>
				<p className="text-sm text-muted-foreground">Users with access to the GitHub repository.</p>
			</div>

			<Suspense fallback={<GitHubUsersTableSkeleton />}>
				<GitHubUsersTableContent />
			</Suspense>
		</div>
	);
}
