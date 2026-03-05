"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, Rocket } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icons } from "@/components/assets/icons";
import { VercelConnectButton } from "@/components/buttons/vercel-connect-button";
import { Link as LinkWithTransition } from "@/components/primitives/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { validateProjectName } from "@/lib/schemas/deployment";
import { cn } from "@/lib/utils";
import { initiateDeployment } from "@/server/actions/deployment-actions";
import type { User } from "@/types/user";

// API helpers for read operations (server actions should only be used for mutations)
async function checkPendingGitHubInvitation(): Promise<{
	hasPendingInvitation: boolean;
	invitationUrl?: string;
}> {
	const response = await fetch(routes.api.github.checkInvitation);
	if (!response.ok) {
		return { hasPendingInvitation: false };
	}
	return response.json();
}

async function checkRepositoryNameAvailable(
	name: string,
): Promise<{ available: boolean; checked: boolean; error?: string }> {
	const response = await fetch(
		`${routes.api.github.checkRepoAvailability}?name=${encodeURIComponent(name)}`,
	);
	if (!response.ok) {
		return { available: true, checked: false };
	}
	return response.json();
}

// Constants for validation and timing
const VALIDATION_DEBOUNCE_MS = 300; // 300ms debounce for validation

interface DashboardVercelDeployProps {
	className?: string;
	isVercelConnected?: boolean;
	user?: User;
	hasActiveDeployment?: boolean;
}

export const DashboardVercelDeploy = ({
	className,
	isVercelConnected = true,
	user,
	hasActiveDeployment = false,
}: DashboardVercelDeployProps) => {
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const pathname = usePathname();
	const isOnDeploymentsPage = pathname === routes.app.deployments;
	const currentUser = user ?? session?.user;
	const [open, setOpen] = useState(false);
	const [projectName, setProjectName] = useState("");
	const [isDeploying, setIsDeploying] = useState(false);
	const [deploymentInitiated, setDeploymentInitiated] = useState(false);
	const [acknowledgedActiveDeployment, setAcknowledgedActiveDeployment] =
		useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [isValidating, setIsValidating] = useState(false);
	const [availabilityChecked, setAvailabilityChecked] = useState(false);
	const [pendingInvitation, setPendingInvitation] = useState<{
		hasPending: boolean;
		url?: string;
		isChecking: boolean;
		isWaitingForAcceptance: boolean;
		isRechecking: boolean;
		justAccepted: boolean;
	}>({
		hasPending: false,
		isChecking: false,
		isWaitingForAcceptance: false,
		isRechecking: false,
		justAccepted: false,
	});
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const validationRequestIdRef = useRef(0);
	const latestProjectNameRef = useRef("");
	const POLLING_INTERVAL_MS = 3000; // Poll every 3 seconds
	const SUCCESS_DISPLAY_MS = 2000; // Show success state for 2 seconds

	// Check for pending GitHub invitation when dialog opens
	useEffect(() => {
		if (open && isVercelConnected) {
			setPendingInvitation((prev) => ({
				...prev,
				isChecking: true,
				isWaitingForAcceptance: false,
				isRechecking: false,
				justAccepted: false,
			}));
			checkPendingGitHubInvitation()
				.then((result) => {
					setPendingInvitation({
						hasPending: result.hasPendingInvitation,
						url: result.invitationUrl,
						isChecking: false,
						isWaitingForAcceptance: false,
						isRechecking: false,
						justAccepted: false,
					});
				})
				.catch(() => {
					setPendingInvitation({
						hasPending: false,
						isChecking: false,
						isWaitingForAcceptance: false,
						isRechecking: false,
						justAccepted: false,
					});
				});
		}
	}, [open, isVercelConnected]);

	// Polling effect - runs when waiting for user to accept invitation
	useEffect(() => {
		if (
			pendingInvitation.isWaitingForAcceptance &&
			pendingInvitation.hasPending
		) {
			pollingIntervalRef.current = setInterval(async () => {
				try {
					const result = await checkPendingGitHubInvitation();
					if (!result.hasPendingInvitation) {
						// Invitation was accepted, update state with success
						setPendingInvitation({
							hasPending: false,
							url: undefined,
							isChecking: false,
							isWaitingForAcceptance: false,
							isRechecking: false,
							justAccepted: true,
						});
					}
				} catch {
					// Silently handle errors during polling
				}
			}, POLLING_INTERVAL_MS);
		}

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, [pendingInvitation.isWaitingForAcceptance, pendingInvitation.hasPending]);

	// Cleanup polling on unmount or dialog close
	useEffect(() => {
		if (!open && pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
	}, [open]);

	// Auto-clear success state after showing success message
	useEffect(() => {
		if (pendingInvitation.justAccepted) {
			const timeout = setTimeout(() => {
				setPendingInvitation((prev) => ({ ...prev, justAccepted: false }));
			}, SUCCESS_DISPLAY_MS);

			return () => clearTimeout(timeout);
		}
	}, [pendingInvitation.justAccepted]);

	// Cleanup debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	// Handle when user clicks the accept invitation link
	const handleAcceptInvitationClick = () => {
		setPendingInvitation((prev) => ({ ...prev, isWaitingForAcceptance: true }));
	};

	// Handle manual recheck of invitation status
	const handleRecheckInvitation = async () => {
		setPendingInvitation((prev) => ({ ...prev, isRechecking: true }));
		try {
			const result = await checkPendingGitHubInvitation();
			const wasAccepted = !result.hasPendingInvitation;
			setPendingInvitation({
				hasPending: result.hasPendingInvitation,
				url: result.invitationUrl,
				isChecking: false,
				isWaitingForAcceptance: result.hasPendingInvitation, // Keep waiting if still pending
				isRechecking: false,
				justAccepted: wasAccepted, // Show success if just accepted
			});
		} catch {
			setPendingInvitation((prev) => ({ ...prev, isRechecking: false }));
		}
	};

	const validateProjectNameDebounced = useCallback((value: string) => {
		// Clear any existing timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Show validating state immediately if there's input
		if (value.trim()) {
			setIsValidating(true);
		}

		// Set new debounce timer
		debounceTimerRef.current = setTimeout(async () => {
			const trimmedValue = value.trim();
			const validationId = validationRequestIdRef.current + 1;
			validationRequestIdRef.current = validationId;
			// Guard against out-of-order async results after fast typing.
			const isCurrentValidation = () =>
				validationId === validationRequestIdRef.current &&
				trimmedValue === latestProjectNameRef.current.trim();

			if (!trimmedValue) {
				if (!isCurrentValidation()) {
					return;
				}
				setValidationError(null);
				setAvailabilityChecked(false);
				setIsValidating(false);
				return;
			}

			// First, validate the format
			const validation = validateProjectName(trimmedValue);
			if (!validation.isValid) {
				if (!isCurrentValidation()) {
					return;
				}
				setValidationError(validation.error ?? "Invalid project name");
				setAvailabilityChecked(false);
				setIsValidating(false);
				return;
			}

			// Then check if the name is available on GitHub
			try {
				const availability = await checkRepositoryNameAvailable(trimmedValue);
				if (!isCurrentValidation()) {
					return;
				}
				setAvailabilityChecked(availability.checked);
				if (!availability.available) {
					setValidationError(
						availability.error ?? "Repository name not available",
					);
				} else {
					setValidationError(null);
				}
			} catch {
				if (!isCurrentValidation()) {
					return;
				}
				// If check fails, clear error and let deployment handle it
				setAvailabilityChecked(false);
				setValidationError(null);
			} finally {
				if (isCurrentValidation()) {
					setIsValidating(false);
				}
			}
		}, VALIDATION_DEBOUNCE_MS);
	}, []);

	const handleProjectNameChange = (value: string) => {
		latestProjectNameRef.current = value;
		setProjectName(value);

		// Clear validation error and availability check immediately when user types
		setValidationError(null);
		setAvailabilityChecked(false);

		// Trigger debounced validation
		validateProjectNameDebounced(value);
	};

	const handleDeploy = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		handleDeployAsync();
	};

	const handleDeployAsync = async () => {
		// Don't submit if validation is in progress - disable submit button instead
		if (isValidating) {
			return;
		}

		// Validate project name before submission
		const validation = validateProjectName(projectName);
		if (!validation.isValid) {
			setValidationError(validation.error ?? "Invalid project name");
			return;
		}

		setIsDeploying(true);

		const formData = new FormData();
		formData.append("projectName", projectName);

		try {
			const result = await initiateDeployment(formData);

			if (result.success) {
				// Invalidate React Query cache so the deployments list refreshes immediately
				await queryClient.invalidateQueries({ queryKey: ["deployments"] });

				if (isOnDeploymentsPage) {
					// User is already on deployments page, just close the dialog
					// so they can see the deployment in the list
					resetForm();
				} else {
					// User is on another page, show success dialog with link to deployments
					setIsDeploying(false);
					setDeploymentInitiated(true);
				}
			} else {
				setValidationError(result.error ?? "Deployment failed to start");
				setIsDeploying(false);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";
			setValidationError(errorMessage);
			setIsDeploying(false);
		}
	};

	const resetForm = () => {
		latestProjectNameRef.current = "";
		setProjectName("");
		setIsDeploying(false);
		setValidationError(null);
		setIsValidating(false);
		setAvailabilityChecked(false);
		setDeploymentInitiated(false);
		setAcknowledgedActiveDeployment(false);
		setOpen(false);
		// Clear any pending validation
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}
	};

	const handleStartNewDeployment = () => {
		setDeploymentInitiated(false);
		latestProjectNameRef.current = "";
		setProjectName("");
		setValidationError(null);
	};

	const triggerButton = isVercelConnected ? (
		<Button
			size="lg"
			// disabled={!isVercelConnected}
			className={cn(
				"group relative overflow-hidden transition-all duration-300 ease-out",
				isVercelConnected && "hover:bg-primary-foreground hover:text-primary",
				className,
			)}
		>
			<span className="relative z-10 flex items-center justify-center gap-2">
				<Icons.vercel className="h-5 w-5" />
				Deploy to Vercel
			</span>
		</Button>
	) : (
		<VercelConnectButton user={user} isConnected={isVercelConnected} />
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{isVercelConnected ? (
				<DialogTrigger asChild>{triggerButton}</DialogTrigger>
			) : (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
						<TooltipContent className="flex flex-col gap-2">
							<p>Connect your Vercel account to deploy</p>
							<LinkWithTransition href={routes.settings.account}>
								<span className="text-xs text-primary hover:underline">
									Go to Settings →
								</span>
							</LinkWithTransition>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
			<DialogContent
				className={cn(
					"sm:max-w-md",
					pendingInvitation.justAccepted && "animate-connection-highlight",
				)}
			>
				{deploymentInitiated ? (
					<div className="py-8 flex flex-col items-center justify-center gap-4">
						<div className="rounded-full bg-primary/10 p-3">
							<Rocket className="h-8 w-8 text-primary" />
						</div>
						<div className="text-center space-y-2">
							<p className="text-lg font-semibold">Deployment Started</p>
							<p className="text-sm text-muted-foreground">
								Your project is being deployed. You can monitor the progress on
								the deployments page.
							</p>
						</div>
						<div className="flex flex-col items-center gap-3 w-full">
							<LinkWithTransition
								href={routes.app.deployments}
								prefetch={false}
								onClick={() => setOpen(false)}
								className="w-full"
							>
								<Button className="w-full">View Deployments</Button>
							</LinkWithTransition>
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={handleStartNewDeployment}
								>
									Start Another Deployment
								</Button>
								<Button variant="ghost" onClick={() => setOpen(false)}>
									Close
								</Button>
							</div>
						</div>
					</div>
				) : hasActiveDeployment && !acknowledgedActiveDeployment ? (
					<div className="py-6 flex flex-col items-center justify-center gap-4">
						<div className="rounded-full bg-yellow-500/10 p-3">
							<AlertTriangle className="h-8 w-8 text-yellow-500" />
						</div>
						<div className="text-center space-y-2">
							<p className="text-lg font-semibold">Deployment in Progress</p>
							<p className="text-sm text-muted-foreground">
								You already have an active deployment. Starting a new one may
								cause conflicts.
							</p>
							<LinkWithTransition
								href={routes.app.deployments}
								onClick={() => setOpen(false)}
								className="text-sm text-primary hover:underline"
							>
								View current deployments →
							</LinkWithTransition>
						</div>
						<div className="flex gap-2 w-full">
							<Button
								variant="outline"
								onClick={() => setOpen(false)}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								onClick={() => setAcknowledgedActiveDeployment(true)}
								className="flex-1"
							>
								Deploy Anyway
							</Button>
						</div>
					</div>
				) : isDeploying ? (
					<div className="py-8 flex flex-col items-center justify-center gap-4">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-sm text-muted-foreground">
							Starting deployment...
						</p>
					</div>
				) : pendingInvitation.justAccepted ? (
					<div className="py-8 flex flex-col items-center justify-center gap-4">
						<div className="rounded-full bg-muted p-3">
							<CheckCircle2 className="h-8 w-8 text-primary" />
						</div>
						<div className="text-center space-y-1">
							<p className="text-lg font-semibold">Access Granted</p>
							<p className="text-sm text-muted-foreground">
								Preparing deployment form...
							</p>
						</div>
					</div>
				) : pendingInvitation.isChecking ? (
					<div className="py-8 flex items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : pendingInvitation.hasPending ? (
					<div className="py-6 space-y-6">
						{/* Avatar section */}
						<div className="flex items-center justify-center gap-2">
							<Avatar className="h-12 w-12 border">
								<AvatarImage
									src="https://github.com/shipkit-io.png?size=80"
									alt="Shipkit"
								/>
								<AvatarFallback>
									<AvatarImage
										src={`https://github.com/${siteConfig.repo.owner}.png?size=80`}
										alt={siteConfig.repo.owner}
									/>
								</AvatarFallback>
							</Avatar>
							<span className="text-muted-foreground text-lg">+</span>
							<Avatar className="h-12 w-12 border">
								<AvatarImage
									src={currentUser?.image ?? undefined}
									alt={currentUser?.name ?? "You"}
								/>
								<AvatarFallback className="bg-muted">
									<Icons.github className="h-6 w-6" />
								</AvatarFallback>
							</Avatar>
						</div>

						{/* Invitation text */}
						<div className="text-center space-y-1">
							<p className="text-lg">
								<a
									href={`https://github.com/${siteConfig.repo.owner}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline font-medium"
								>
									{siteConfig.branding.githubOrg}
								</a>{" "}
								<span className="text-foreground">
									invited you to collaborate on
								</span>
							</p>
							<p className="text-lg font-semibold">
								{siteConfig.repo.owner}/{siteConfig.repo.name}
							</p>
						</div>

						{/* Buttons */}
						<div className="flex flex-col items-center gap-3">
							{pendingInvitation.isWaitingForAcceptance ? (
								<>
									{/* Waiting state - show loader and recheck button */}
									<div className="flex items-center gap-2 text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" />
										<span className="text-sm">
											Waiting for you to accept the invitation...
										</span>
									</div>
									<div className="flex items-center gap-3">
										<Button
											variant="outline"
											onClick={handleRecheckInvitation}
											disabled={pendingInvitation.isRechecking}
										>
											{pendingInvitation.isRechecking ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin mr-2" />
													Checking...
												</>
											) : (
												"I've accepted - check again"
											)}
										</Button>
										<Button variant="ghost" onClick={() => setOpen(false)}>
											Cancel
										</Button>
									</div>
									<p className="text-xs text-muted-foreground text-center">
										We&apos;ll automatically detect when you accept the
										invitation
									</p>
								</>
							) : (
								<>
									{/* Initial state - show accept button */}
									<div className="flex items-center gap-3">
										<Button
											asChild
											className="bg-[#2da44e] hover:bg-[#2c974b] text-white font-semibold"
											onClick={handleAcceptInvitationClick}
										>
											<a
												href={
													pendingInvitation.url ??
													"https://github.com/notifications"
												}
												target="_blank"
												rel="noopener noreferrer"
											>
												Accept invitation
											</a>
										</Button>
										<Button variant="outline" onClick={() => setOpen(false)}>
											Cancel
										</Button>
									</div>
								</>
							)}
						</div>
					</div>
				) : (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Icons.vercel className="h-5 w-5" />
								Deploy to Vercel
							</DialogTitle>
							<DialogDescription>
								Create your own instance on GitHub and deploy it to Vercel
								instantly.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleDeploy} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="projectName">Project Name</Label>
								<div className="relative">
									<Input
										id="projectName"
										placeholder={`my-${siteConfig.branding.projectSlug}-app`}
										value={projectName}
										onChange={(e) => handleProjectNameChange(e.target.value)}
										disabled={isDeploying}
										className={cn(
											validationError ? "border-red-500" : "",
											isValidating ? "pr-10" : "",
										)}
									/>
									{isValidating && (
										<div className="absolute right-3 top-1/2 -translate-y-1/2">
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
										</div>
									)}
								</div>
								{validationError ? (
									<p className="text-xs text-red-500">{validationError}</p>
								) : isValidating ? (
									<p className="text-xs text-muted-foreground">
										Checking availability...
									</p>
								) : projectName && !validationError && availabilityChecked ? (
									<p className="text-xs text-green-600">✓ Name available</p>
								) : projectName && !validationError ? (
									<p className="text-xs text-yellow-600">
										✓ Valid format (couldn&apos;t verify GitHub availability)
									</p>
								) : (
									<p className="text-xs text-muted-foreground">
										Lowercase letters, numbers, hyphens, underscores, and dots
										only
									</p>
								)}
							</div>

							<div className="flex gap-2">
								<Button
									type="submit"
									disabled={
										isDeploying ||
										!projectName ||
										!!validationError ||
										isValidating
									}
									className="flex-1"
								>
									Deploy Now
								</Button>
								<Button
									type="button"
									onClick={resetForm}
									variant="outline"
									disabled={isDeploying}
								>
									Cancel
								</Button>
							</div>

							<p className="text-xs text-center text-muted-foreground">
								Ensure you&apos;ve connected GitHub and Vercel in{" "}
								<LinkWithTransition
									href={routes.settings.account}
									onClick={() => setOpen(false)}
								>
									<span className="text-primary hover:underline">Settings</span>
								</LinkWithTransition>
							</p>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};
