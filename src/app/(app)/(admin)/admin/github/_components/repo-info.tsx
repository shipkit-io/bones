import { AlertCircle, Code, ExternalLink, Eye, GitFork, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRepo } from "@/server/services/github/github-service";

export function RepoInfoSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-5 w-[200px] mb-2" />
				<Skeleton className="h-4 w-[300px]" />
			</CardHeader>
			<CardContent>
				<div className="grid gap-4">
					<Skeleton className="h-20 w-full" />
					<div className="flex gap-4">
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-8 w-24" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export async function RepoInfoContent() {
	const repo = await getRepo();

	if (!repo) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Repository Information</CardTitle>
					<CardDescription>Unable to fetch repository details</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center space-x-2 text-muted-foreground">
						<AlertCircle className="h-5 w-5" />
						<p>
							Could not retrieve repository information. Check your GitHub API token and repository
							configuration in site settings.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Code className="h-5 w-5" />
					Repository Information
				</CardTitle>
				<CardDescription>Details about the GitHub repository for this application</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4">
					<div className="space-y-2">
						<h3 className="font-medium">{repo.full_name}</h3>
						<p className="text-sm text-muted-foreground">
							{repo.description || "No description available"}
						</p>

						{repo.homepage && (
							<p className="text-sm">
								<span className="font-medium">Homepage: </span>
								<Link
									href={repo.homepage}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									{repo.homepage}
								</Link>
							</p>
						)}

						<div className="pt-2">
							<Badge variant={repo.private ? "default" : "secondary"}>
								{repo.private ? "Private" : "Public"}
							</Badge>
							{repo.archived && (
								<Badge variant="destructive" className="ml-2">
									Archived
								</Badge>
							)}
							{repo.default_branch && (
								<Badge variant="outline" className="ml-2">
									Branch: {repo.default_branch}
								</Badge>
							)}
						</div>
					</div>

					<div className="flex flex-wrap gap-4 pt-2">
						<div className="flex items-center gap-2">
							<Star className="h-4 w-4 text-amber-500" />
							<span className="text-sm font-medium">
								{repo.stargazers_count.toLocaleString()} stars
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Eye className="h-4 w-4 text-blue-500" />
							<span className="text-sm font-medium">
								{repo.watchers_count.toLocaleString()} watchers
							</span>
						</div>
						<div className="flex items-center gap-2">
							<GitFork className="h-4 w-4 text-purple-500" />
							<span className="text-sm font-medium">{repo.forks_count.toLocaleString()} forks</span>
						</div>
					</div>

					<div className="pt-2">
						<Button asChild variant="outline" size="sm">
							<Link
								href={repo.html_url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2"
							>
								<ExternalLink className="h-4 w-4" />
								View on GitHub
							</Link>
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default async function RepoInfo() {
	return (
		<div className="space-y-8">
			<RepoInfoContent />
		</div>
	);
}
