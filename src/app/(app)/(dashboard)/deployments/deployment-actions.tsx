"use client";

import { ExternalLink, MoreHorizontal, Square, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cancelDeployment, deleteDeployment } from "@/server/actions/deployment-actions";
import type { Deployment } from "@/server/db/schema";

interface DeploymentActionsProps {
	deployment: Deployment;
}

export function DeploymentActions({ deployment }: DeploymentActionsProps) {
	const router = useRouter();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isCanceling, setIsCanceling] = useState(false);

	const handleDeleteDeployment = async () => {
		setIsDeleting(true);
		try {
			await deleteDeployment(deployment.id);
			toast.success("Deployment record deleted successfully.");
			router.refresh();
		} catch (error) {
			console.error("Failed to delete deployment:", error);
			toast.error("Failed to delete deployment. Please try again.");
		} finally {
			setIsDeleting(false);
			setDeleteDialogOpen(false);
		}
	};

	const handleCancelDeployment = async () => {
		setIsCanceling(true);
		try {
			await cancelDeployment(deployment.id);
			toast.success("Deployment canceled successfully.");
			router.refresh();
		} catch (error) {
			console.error("Failed to cancel deployment:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to cancel deployment. Please try again."
			);
		} finally {
			setIsCanceling(false);
			setCancelDialogOpen(false);
		}
	};

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0"
						data-testid="deployment-actions-trigger"
					>
						<span className="sr-only">Open menu</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>

					{deployment.vercelDeploymentUrl && (
						<DropdownMenuItem asChild data-testid="deployment-actions-view-deployment">
							<a
								href={deployment.vercelDeploymentUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2"
							>
								<ExternalLink className="h-3 w-3" />
								View Deployment
							</a>
						</DropdownMenuItem>
					)}

					{deployment.githubRepoUrl && (
						<DropdownMenuItem asChild data-testid="deployment-actions-view-github">
							<a
								href={deployment.githubRepoUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2"
							>
								<svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-label="GitHub" role="img">
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
								View on GitHub
							</a>
						</DropdownMenuItem>
					)}

					{deployment.vercelProjectUrl && deployment.vercelDeploymentId && (
						<DropdownMenuItem asChild data-testid="deployment-actions-view-vercel-deployment">
							<a
								href={`${deployment.vercelProjectUrl}/${deployment.vercelDeploymentId}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2"
							>
								<svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-label="Vercel" role="img">
									<path d="M24 22.525H0l12-21.05 12 21.05z" />
								</svg>
								View Deployment on Vercel
							</a>
						</DropdownMenuItem>
					)}

					{deployment.vercelProjectUrl && (
						<DropdownMenuItem asChild data-testid="deployment-actions-view-vercel">
							<a
								href={`${deployment.vercelProjectUrl}/deployments`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2"
							>
								<svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-label="Vercel" role="img">
									<path d="M24 22.525H0l12-21.05 12 21.05z" />
								</svg>
								View Project on Vercel
							</a>
						</DropdownMenuItem>
					)}

					<DropdownMenuSeparator />

					{deployment.status === "deploying" && (
						<DropdownMenuItem
							onClick={() => setCancelDialogOpen(true)}
							className="text-yellow-600 focus:text-yellow-600"
							data-testid="deployment-actions-cancel"
						>
							<Square className="h-3 w-3 mr-2" />
							Cancel
						</DropdownMenuItem>
					)}

					<DropdownMenuItem
						onClick={() => setDeleteDialogOpen(true)}
						className="text-red-600 focus:text-red-600"
						data-testid="deployment-actions-delete"
					>
						<Trash2 className="h-3 w-3 mr-2" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Deployment Record</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this deployment record? This will only remove the
							record from your deployment history and will not affect the actual deployment.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteDeployment}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700"
							data-testid="deployment-actions-confirm-delete"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Deployment</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel this deployment? This will mark the deployment as
							failed. Note: This does not stop any ongoing processes on GitHub or Vercel.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCanceling}>Keep Running</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancelDeployment}
							disabled={isCanceling}
							className="bg-yellow-600 hover:bg-yellow-700"
							data-testid="deployment-actions-confirm-cancel"
						>
							{isCanceling ? "Canceling..." : "Cancel Deployment"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
