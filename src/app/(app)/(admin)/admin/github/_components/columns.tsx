"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ExternalLink, Trash2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useToast } from "@/hooks/use-toast";
import type { GitHubProfile } from "@/server/services/github/github-service";
import { revokeGitHubAccessAction } from "../actions";

export interface GitHubUserData {
	id: string;
	email: string;
	name: string | null;
	githubUsername: string | null;
	createdAt: Date;
	updatedAt: Date | null;
	githubDetails: GitHubProfile | null;
}

function formatDate(date: Date | null) {
	if (!date) return "N/A";
	return format(date, "MMM d, yyyy");
}

export const columns: ColumnDef<GitHubUserData>[] = [
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => row.original.name ?? "N/A",
	},
	{
		accessorKey: "githubUsername",
		header: "GitHub Profile",
		cell: ({ row }) => {
			const details = row.original.githubDetails;
			if (!details) return row.original.githubUsername;

			return (
				<HoverCard openDelay={100} closeDelay={100}>
					<HoverCardTrigger asChild>
						<div className="flex items-center gap-2">
							<Avatar className="h-8 w-8">
								<AvatarImage src={details.avatar_url} alt={details.login} />
								<AvatarFallback>{details.login.slice(0, 2).toUpperCase()}</AvatarFallback>
							</Avatar>
							<Badge variant="outline" className="font-mono">
								{details.login}
							</Badge>
						</div>
					</HoverCardTrigger>
					<HoverCardContent className="w-80">
						<div className="flex justify-between space-x-4">
							<Avatar className="h-12 w-12">
								<AvatarImage src={details.avatar_url} alt={details.login} />
								<AvatarFallback>{details.login.slice(0, 2).toUpperCase()}</AvatarFallback>
							</Avatar>
							<div className="space-y-1">
								<h4 className="text-sm font-semibold">{details.name || details.login}</h4>
								{details.bio && <p className="text-sm text-muted-foreground">{details.bio}</p>}
								<div className="flex items-center gap-2 pt-2">
									<Users className="h-3 w-3 opacity-70" />
									<span className="text-xs text-muted-foreground">
										{details.followers} followers · {details.following} following
									</span>
								</div>
								<div className="flex items-center gap-2 pt-2">
									<Button variant="outline" size="sm" className="h-7 w-7" asChild>
										<a href={details.html_url} target="_blank" rel="noopener noreferrer">
											<ExternalLink className="h-3 w-3" />
										</a>
									</Button>
									<Badge variant="secondary" className="font-mono">
										{details.permission}
									</Badge>
								</div>
							</div>
						</div>
					</HoverCardContent>
				</HoverCard>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: "Access Granted",
		cell: ({ row }) => formatDate(row.original.createdAt),
	},
	{
		accessorKey: "updatedAt",
		header: "Last Updated",
		cell: ({ row }) => formatDate(row.original.updatedAt),
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const { toast } = useToast();
			const handleRevoke = async () => {
				try {
					const result = await revokeGitHubAccessAction(row.original.id);
					if (result.success) {
						toast({
							title: "Access Revoked",
							description: "GitHub access has been revoked successfully.",
						});
						// Optionally refresh the page or update the table
						window.location.reload();
					} else {
						toast({
							title: "Error",
							description: result.error || "Failed to revoke GitHub access",
							variant: "destructive",
						});
					}
				} catch (error) {
					toast({
						title: "Error",
						description: "Failed to revoke GitHub access",
						variant: "destructive",
					});
				}
			};

			return (
				<Button variant="ghost" size="icon" onClick={() => void handleRevoke()} className="h-8 w-8">
					<Trash2 className="h-4 w-4" />
				</Button>
			);
		},
	},
];
