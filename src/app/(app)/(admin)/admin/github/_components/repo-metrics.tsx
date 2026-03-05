import { AlertCircle, Clock, GitCommit, GitMerge, GitPullRequest } from "lucide-react";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site-config";
import { octokit } from "@/server/services/github/github-service";

interface RepoMetric {
	id: string;
	title: string;
	value: string | number;
	icon: React.ReactNode;
	description: string;
}

interface RepoMetricsProps {
	className?: string;
}

export function RepoMetricsSkeleton() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<Card key={i}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<div className="h-4 w-24 bg-muted animate-pulse rounded" />
						<div className="h-4 w-4 bg-muted animate-pulse rounded" />
					</CardHeader>
					<CardContent>
						<div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
						<div className="h-3 w-32 bg-muted animate-pulse rounded" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export async function RepoMetricsContent() {
	const repoOwner = siteConfig.repo.owner;
	const repoName = siteConfig.repo.name;

	try {
		// Check if octokit is available
		if (!octokit) {
			return (
				<div className="grid gap-4 md:grid-cols-1">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<AlertCircle className="h-5 w-5 text-amber-500" />
								GitHub API Unavailable
							</CardTitle>
							<CardDescription>
								GitHub API client is not configured. Repository metrics cannot be displayed.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">To enable GitHub repository metrics:</p>
							<ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
								<li>
									Set <code>NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED=true</code>
								</li>
								<li>
									Configure <code>GITHUB_ACCESS_TOKEN</code> in your environment
								</li>
							</ul>
						</CardContent>
					</Card>
				</div>
			);
		}

		// Get pull requests count
		const { data: pullRequests } = await octokit.rest.pulls.list({
			owner: repoOwner,
			repo: repoName,
			state: "all",
			per_page: 1,
		});

		const prCount = pullRequests[0]?.number || 0;

		// Get recent commits
		const { data: commits } = await octokit.rest.repos.listCommits({
			owner: repoOwner,
			repo: repoName,
			per_page: 30,
		});

		// Get branches
		const { data: branches } = await octokit.rest.repos.listBranches({
			owner: repoOwner,
			repo: repoName,
			per_page: 100,
		});

		// Calculate last activity (in days)
		const lastCommitDate = commits[0]?.commit?.author?.date
			? new Date(commits[0].commit.author.date)
			: new Date();
		const daysSinceLastCommit = Math.floor(
			(new Date().getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		const metrics: RepoMetric[] = [
			{
				id: "pull-requests",
				title: "Pull Requests",
				value: prCount,
				icon: <GitPullRequest className="h-4 w-4 text-blue-500" />,
				description: "Total pull requests",
			},
			{
				id: "recent-commits",
				title: "Recent Commits",
				value: commits.length,
				icon: <GitCommit className="h-4 w-4 text-green-500" />,
				description: "Last 30 commits",
			},
			{
				id: "branches",
				title: "Branches",
				value: branches.length,
				icon: <GitMerge className="h-4 w-4 text-purple-500" />,
				description: "Active branches",
			},
			{
				id: "last-activity",
				title: "Last Activity",
				value: daysSinceLastCommit === 0 ? "Today" : `${daysSinceLastCommit} days ago`,
				icon: <Clock className="h-4 w-4 text-amber-500" />,
				description: "Since last commit",
			},
		];

		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{metrics.map((metric) => (
					<Card key={metric.id}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
							{metric.icon}
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{metric.value}</div>
							<p className="text-xs text-muted-foreground">{metric.description}</p>
						</CardContent>
					</Card>
				))}
			</div>
		);
	} catch (error) {
		console.error("Error fetching repo metrics:", error);
		return (
			<div className="grid gap-4 md:grid-cols-1">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-red-500" />
							Error Loading Repository Metrics
						</CardTitle>
						<CardDescription>Failed to fetch repository information from GitHub</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							There was an error connecting to the GitHub API. Please check your configuration and
							try again.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}
}

export default function RepoMetrics({ className }: RepoMetricsProps) {
	return (
		<div className={className}>
			<Suspense fallback={<RepoMetricsSkeleton />}>
				<RepoMetricsContent />
			</Suspense>
		</div>
	);
}
