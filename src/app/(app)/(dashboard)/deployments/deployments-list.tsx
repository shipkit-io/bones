"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, Rocket } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Icons } from "@/components/assets/icons";
import { DashboardVercelDeploy } from "@/components/modules/deploy/dashboard-vercel-deploy";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table/data-table";
import { siteConfig } from "@/config/site-config";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import type { Deployment } from "@/server/db/schema";
import { DeploymentActions } from "./deployment-actions";
import { Link2Icon } from "@radix-ui/react-icons";

// Constants for polling configuration
const POLLING_INTERVAL_MS = 3000; // 3 seconds

/**
 * Poll whenever deployments are still in progress
 */
function isActivelyDeploying(deployment: Deployment): boolean {
	return deployment.status === "deploying";
}

interface DeploymentsListProps {
	deployments: Deployment[];
}

async function fetchDeployments(): Promise<Deployment[]> {
	const response = await fetch(routes.api.deployments);
	if (!response.ok) {
		throw new Error("Failed to fetch deployments");
	}
	const data = await response.json();
	return data.deployments;
}

function getStatusIcon(status: string) {
	switch (status) {
		case "completed":
			return <CheckCircle2 className="h-4 w-4 text-green-500" />;
		case "failed":
			return <AlertCircle className="h-4 w-4 text-red-500" />;
		case "deploying":
			return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
		default:
			return null;
	}
}

function getStatusBadgeVariant(status: string) {
	switch (status) {
		case "completed":
			return "default" as const;
		case "failed":
			return "destructive" as const;
		case "deploying":
			return "secondary" as const;
		default:
			return "outline" as const;
	}
}

export function DeploymentsList({ deployments: initialDeployments }: DeploymentsListProps) {
	const [hasActiveDeployments, setHasActiveDeployments] = useState(
		initialDeployments.some(isActivelyDeploying)
	);
	// Counter to force re-renders for timestamp updates
	const [, setTick] = useState(0);
	// Track previous deployments to detect status changes
	const previousDeploymentsRef = useRef<Map<string, Deployment>>(
		new Map(initialDeployments.map((d) => [d.id, d]))
	);

	// Use React Query for efficient polling
	// Only poll if there are deployments still in progress or pending verification
	const { data: deployments = initialDeployments } = useQuery({
		queryKey: ["deployments"],
		queryFn: fetchDeployments,
		initialData: initialDeployments,
		refetchInterval: hasActiveDeployments ? POLLING_INTERVAL_MS : false,
		refetchIntervalInBackground: true,
		staleTime: 1000, // Consider data stale after 1 second
	});

	// Detect status changes and show toasts
	useEffect(() => {
		const previousMap = previousDeploymentsRef.current;

		for (const deployment of deployments) {
			const previous = previousMap.get(deployment.id);

			// Only show toast if status changed from "deploying" to a terminal state
			if (previous?.status === "deploying" && deployment.status !== "deploying") {
				if (deployment.status === "completed") {
					toast.success(`Deployment "${deployment.projectName}" completed successfully!`);
				} else if (deployment.status === "failed") {
					toast.error(
						`Deployment "${deployment.projectName}" failed: ${deployment.error || "Unknown error"}`,
						{ duration: 10000 }
					);
				}
			}
		}

		// Update the ref with current deployments
		previousDeploymentsRef.current = new Map(deployments.map((d) => [d.id, d]));
	}, [deployments]);

	// Update polling state when deployments change
	// Keep polling while any deployment still needs status verification
	useEffect(() => {
		const shouldPoll = deployments.some(isActivelyDeploying);
		setHasActiveDeployments(shouldPoll);
	}, [deployments]);

	// Live-update timestamps every second while there are active deployments
	useEffect(() => {
		if (!hasActiveDeployments) return;
		const interval = setInterval(() => {
			setTick((t) => t + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [hasActiveDeployments]);

	// Memoize columns to prevent re-renders from closing dropdown menus
	const columns: ColumnDef<Deployment>[] = useMemo(() => [
		{
			accessorKey: "projectName",
			header: "Project",
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Rocket className="h-4 w-4 text-muted-foreground" />
					<span className="font-medium">{row.original.projectName}</span>
				</div>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<Badge
					variant={getStatusBadgeVariant(row.original.status)}
					className="flex items-center gap-1 w-fit"
				>
					{getStatusIcon(row.original.status)}
					<span className="capitalize">{row.original.status}</span>
				</Badge>
			),
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => (
				<div>
					<span className="text-muted-foreground">
						{row.original.description ?? "No description"}
					</span>
					{row.original.status === "failed" && row.original.error && (
						<div className="mt-1">
							<span className="text-xs text-red-600 dark:text-red-400">
								Error: {row.original.error}
							</span>
						</div>
					)}
				</div>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Deployed",
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
				</span>
			),
		},
		{
			id: "links",
			header: "",
			cell: ({ row }) => (
				<div className="flex items-center gap-1">
					{row.original.vercelProjectUrl && (
						<a
							href={row.original.vercelProjectUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
							title="View on Vercel"
						>
							<Icons.vercel className="h-4 w-4" />
						</a>
					)}
					{row.original.githubRepoUrl && (
						<a
							href={row.original.githubRepoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
							title="View on GitHub"
						>
							<Icons.github className="h-4 w-4" />
						</a>
					)}
					{row.original.vercelDeploymentUrl && (
						<a
							href={row.original.vercelDeploymentUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
							title="View deployment"
						>
							<Link2Icon className="h-4 w-4" />
						</a>
					)}
				</div>
			),
		},
		{
			id: "actions",
			cell: ({ row }) => <DeploymentActions deployment={row.original} />,
		},
	], []);

	return (
		<>
			{deployments.length === 0 ? (
				<div className="text-center py-12 bg-muted/50 rounded-lg">
					<Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 className="text-lg font-semibold mb-2">No deployments yet</h3>
					<p className="text-muted-foreground mb-6">
						Deploy your first {siteConfig.title} instance to get started
					</p>
					<DashboardVercelDeploy />
				</div>
			) : (
				<DataTable
					columns={columns}
					data={deployments}
					className={cn("[&_td]:py-3", "[&_th]:font-semibold", "[&_tr]:border-b")}
				/>
			)}
		</>
	);
}
