"use client";

import { FolderSyncIcon, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsyncAction } from "@/hooks/use-async-state";
import { useToast } from "@/hooks/use-toast";
import { deleteAllPayments, importPayments, refreshAllPayments } from "@/server/actions/payments";

type PaymentProvider = "lemonsqueezy" | "polar" | "stripe" | "all";
type ActionType = "import" | "delete" | "refresh";

interface SingleProviderResult {
	total: number;
	imported: number;
	skipped: number;
	errors: number;
	usersCreated: number;
}

type AllProvidersResult = Record<string, SingleProviderResult>;

/**
 * Formats the import result message based on the provider and result data
 */
const formatImportMessage = (provider: PaymentProvider, result: unknown): string => {
	if (!result) {
		return "No result returned from import operation";
	}

	if (provider === "all") {
		const allResult = result as AllProvidersResult;
		const messages: string[] = [];

		// Format each provider's results
		for (const [providerId, stats] of Object.entries(allResult)) {
			if (stats && typeof stats === "object" && !("error" in stats)) {
				const providerStats = stats;
				const providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);
				messages.push(
					`${providerName}: ${providerStats.imported} imported, ${providerStats.skipped} skipped, ${providerStats.errors} errors, ${providerStats.usersCreated} users created`
				);
			} else if (stats && typeof stats === "object" && "error" in stats) {
				const providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);
				messages.push(`${providerName}: Error - ${stats.error || "Unknown error"}`);
			}
		}

		return messages.length > 0 ? messages.join("\n") : "No valid results from providers";
	}

	const singleResult = result as SingleProviderResult;
	if (typeof singleResult?.imported === "undefined") {
		return "Invalid result structure for single provider import";
	}
	return `${singleResult.imported} imported, ${singleResult.skipped} skipped, ${singleResult.errors} errors, ${singleResult.usersCreated} users created.`;
};

/**
 * Component to import users and payments from payment providers
 */
export function ImportPayments() {
	const { toast } = useToast();
	const [currentProvider, setCurrentProvider] = useState<PaymentProvider | null>(null);
	const [currentAction, setCurrentAction] = useState<ActionType | null>(null);
	const [progress, setProgress] = useState<string>("");

	const { loading, error, execute } = useAsyncAction(
		async (action: ActionType, provider?: PaymentProvider) => {
			setCurrentAction(action);
			setProgress("");

			if (action === "import" && provider) {
				setCurrentProvider(provider);
				setProgress("Connecting to payment provider...");

				// Show initial progress
				toast({
					title: `Starting ${provider === "all" ? "multi-provider" : provider} import`,
					description: "This may take several minutes. Please do not close this page.",
					variant: "default",
				});

				try {
					setProgress("Fetching payment data...");
					const result = await importPayments(provider);

					// Show success toast
					toast({
						title: `${provider === "all" ? "All payments" : provider} import complete`,
						description: formatImportMessage(provider, result),
						variant: "default",
					});

					setProgress("Import completed successfully");
				} catch (importError) {
					setProgress("Import failed");
					throw importError;
				}
			} else if (action === "delete") {
				setProgress("Deleting all payments...");

				toast({
					title: "Deleting all payments",
					description: "This operation cannot be undone.",
					variant: "destructive",
				});

				try {
					const result = await deleteAllPayments();

					// Show success toast
					toast({
						title: "All payments deleted",
						description: result.message || `Successfully deleted ${result.deletedCount} payments`,
						variant: "default",
					});

					setProgress("Deletion completed");
				} catch (deleteError) {
					setProgress("Deletion failed");
					throw deleteError;
				}
			} else if (action === "refresh") {
				setProgress("Refreshing all payments...");

				toast({
					title: "Refreshing all payments",
					description:
						"Deleting existing data and importing fresh data. This may take several minutes.",
					variant: "default",
				});

				try {
					const result = await refreshAllPayments();

					// Show success toast
					toast({
						title: "All payments refreshed",
						description:
							result.message ||
							`Successfully refreshed payments: deleted ${result.deletedCount} old payments and imported fresh data`,
						variant: "default",
					});

					setProgress("Refresh completed");
				} catch (refreshError) {
					setProgress("Refresh failed");
					throw refreshError;
				}
			}

			setCurrentProvider(null);
			setCurrentAction(null);
			setProgress("");
		}
	);

	// Handle error toast in useEffect to avoid calling during render
	useEffect(() => {
		if (error) {
			// Convert error to string if it's an Error object
			const errorString =
				error && typeof error === "object" && "message" in error
					? (error as Error).message
					: String(error);
			let errorMessage = errorString;

			// Provide user-friendly error messages
			if (errorString.includes("timeout") || errorString.includes("Timeout")) {
				errorMessage =
					"The import process timed out. This usually means there's a lot of data to process. Please try again later or contact support.";
			} else if (errorString.includes("rate limit") || errorString.includes("Rate limit")) {
				errorMessage = "Too many import requests. Please wait an hour before trying again.";
			} else if (errorString.includes("Unauthorized")) {
				errorMessage = "You don't have permission to perform this action.";
			} else if (errorString.includes("connection") || errorString.includes("Connection")) {
				errorMessage = "Database connection error. Please try again in a few minutes.";
			}

			toast({
				title: `${currentAction === "import" ? "Import" : currentAction === "delete" ? "Delete" : "Refresh"} failed`,
				description: errorMessage,
				variant: "destructive",
			});
		}
	}, [error, currentAction, toast]);

	/**
	 * Handles the import process for a specific provider
	 */
	const handleImport = (provider: PaymentProvider) => {
		if (loading) return; // Prevent multiple simultaneous imports

		execute("import", provider).catch((err: Error) => {
			console.error("Error importing payments", err);
			setCurrentProvider(null);
			setCurrentAction(null);
			setProgress("");
		});
	};

	/**
	 * Handles the delete all payments process
	 */
	const handleDeleteAll = () => {
		if (loading) return;

		execute("delete").catch((err: Error) => {
			console.error("Error deleting payments", err);
			setCurrentAction(null);
			setProgress("");
		});
	};

	/**
	 * Handles the refresh all payments process
	 */
	const handleRefreshAll = () => {
		if (loading) return;

		execute("refresh").catch((err: Error) => {
			console.error("Error refreshing payments", err);
			setCurrentAction(null);
			setProgress("");
		});
	};

	/**
	 * Gets the loading text based on current action
	 */
	const getLoadingText = () => {
		if (progress) {
			return progress;
		}

		if (currentAction === "import") {
			return `Importing ${currentProvider}...`;
		}
		if (currentAction === "delete") {
			return "Deleting all payments...";
		}
		if (currentAction === "refresh") {
			return "Refreshing all payments...";
		}
		return "Processing...";
	};

	/**
	 * Gets the loading icon based on current action
	 */
	const getLoadingIcon = () => {
		if (currentAction === "import") {
			return <FolderSyncIcon className="mr-2 h-4 w-4" />;
		}
		if (currentAction === "delete") {
			return <Trash2 className="mr-2 h-4 w-4" />;
		}
		if (currentAction === "refresh") {
			return <RotateCcw className="mr-2 h-4 w-4" />;
		}
		return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" disabled={loading}>
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{getLoadingText()}
						</>
					) : (
						<>
							<FolderSyncIcon className="mr-2 h-4 w-4" />
							Payment Actions
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Import Payments</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => handleImport("lemonsqueezy")} disabled={loading}>
					<FolderSyncIcon className="mr-2 h-4 w-4" />
					Import Lemon Squeezy
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleImport("polar")} disabled={loading}>
					<FolderSyncIcon className="mr-2 h-4 w-4" />
					Import Polar
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleImport("stripe")} disabled={loading}>
					<FolderSyncIcon className="mr-2 h-4 w-4" />
					Import Stripe
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleImport("all")} disabled={loading}>
					<FolderSyncIcon className="mr-2 h-4 w-4" />
					Import All Providers
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>Manage Payments</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleRefreshAll} disabled={loading}>
					<RotateCcw className="mr-2 h-4 w-4" />
					Refresh All Payments
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={handleDeleteAll}
					disabled={loading}
					className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Delete All Payments
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
