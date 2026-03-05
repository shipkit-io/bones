"use client";

import { ChevronDown, ChevronUp, Github, Loader2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface GitHubIntegrationProps {
	changedFiles: { path: string; content: string }[];
	disabled?: boolean;
	command?: string; // The shadcn command being executed
}

export function GitHubIntegration({ changedFiles, disabled, command }: GitHubIntegrationProps) {
	// Extract component name from command once
	const extractComponentInfo = () => {
		if (!command) return null;
		const match = /add\s+(\w+)/.exec(command);
		return match ? match[1] : null;
	};

	const componentName = extractComponentInfo();
	const isoString = new Date().toISOString();
	const isoParts = isoString.split("T");
	const timestamp = isoParts[0] || ""; // YYYY-MM-DD

	const timePart = isoParts[1];
	const timeComponent = timePart ? timePart.split(".")[0]?.replace(/:/g, "-") || "" : ""; // HH-MM-SS

	// Generate default values once
	const defaultValues = {
		branchName: componentName
			? `shipkit/add-${componentName}-${timestamp}`
			: `shipkit/add-components-${timestamp}-${timeComponent}`,
		title: componentName ? `Add ${componentName} component` : "Add Shadcn UI components",
		description: "",
	};

	// State management
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [prUrl, setPrUrl] = useState<string | null>(null);
	const [showCustomization, setShowCustomization] = useState(false);
	const [progressMessages, setProgressMessages] = useState<string[]>([]);

	// Form state
	const [branchName, setBranchName] = useState(defaultValues.branchName);
	const [commitMessage, setCommitMessage] = useState(defaultValues.title);
	const [prTitle, setPrTitle] = useState(defaultValues.title);
	const [prBody, setPrBody] = useState(defaultValues.description);

	// Helper functions
	const addProgressMessage = (message: string) => {
		setProgressMessages((prev) => [...prev, message]);
	};

	const generatePrBody = () => {
		const componentsList = changedFiles
			.filter((file) => file.path.includes("component") && file.path.includes(".tsx"))
			.map((file) => file.path.split("/").pop()?.replace(".tsx", ""))
			.filter(Boolean);

		const sections = [
			"## Shadcn UI Components Added",
			command && `Command: \`${command}\``,
			"\n### Changed Files",
			changedFiles.map((file) => `- \`${file.path}\``).join("\n"),
			componentsList.length > 0 && "\n### Components Added",
			componentsList.length > 0 && componentsList.map((name) => `- ${name}`).join("\n"),
		].filter(Boolean);

		return sections.join("\n");
	};

	const handleGitHubError = (error: unknown) => {
		console.error("Error during GitHub operation:", error);
		let errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

		const errorTypes = {
			"authentication failed": ". Please check if your GitHub access token is valid.",
			"permission denied": ". Please check if you have the necessary permissions.",
			"rate limit": ". Please try again later.",
		};

		for (const [type, message] of Object.entries(errorTypes)) {
			if (errorMessage.includes(type)) {
				errorMessage += message;
				break;
			}
		}

		setError(errorMessage);
	};

	const makeGitHubRequest = async (
		endpoint: string,
		data: object,
		progressMessage: string,
		successMessage: string | ((data: any) => string)
	) => {
		addProgressMessage(progressMessage);
		const response = await fetch(`/install/api/github/${endpoint}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		const responseData = await response.json();
		if (!response.ok) {
			throw new Error(responseData.details || responseData.error || `Failed to ${endpoint}`);
		}

		addProgressMessage(
			typeof successMessage === "function" ? successMessage(responseData) : successMessage
		);
		return responseData;
	};

	const handleSubmit = async () => {
		if (changedFiles.length === 0) {
			setError("No changes to submit. Please add components first.");
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(null);
		setPrUrl(null);
		setProgressMessages([]);

		try {
			// Check if branch exists
			const branchCheckData = await makeGitHubRequest(
				"create-branch",
				{ branchName: branchName.trim(), checkOnly: true },
				"Checking if branch exists...",
				""
			);

			// Handle existing branch
			if (branchCheckData.exists) {
				const newBranchName = `${branchName}-${timeComponent}`;
				setBranchName(newBranchName);
				addProgressMessage(
					`Branch "${branchName}" already exists, using "${newBranchName}" instead`
				);
			}

			// Create branch
			await makeGitHubRequest(
				"create-branch",
				{ branchName: branchName.trim() },
				"Creating new branch...",
				`Branch "${branchName}" created successfully`
			);

			// Commit changes
			await makeGitHubRequest(
				"commit-changes",
				{
					branchName: branchName.trim(),
					commitMessage: commitMessage.trim(),
					files: changedFiles,
				},
				"Committing changes...",
				`Changes committed successfully to branch "${branchName}"`
			);

			// Create PR
			const prData = await makeGitHubRequest(
				"create-pr",
				{
					branchName: branchName.trim(),
					title: prTitle.trim(),
					body: prBody.trim() || generatePrBody(),
				},
				"Creating pull request...",
				(data) => `Pull request #${data.pull_number} created successfully!`
			);

			setSuccess("All steps completed successfully!");
			setPrUrl(prData.html_url);
		} catch (error) {
			handleGitHubError(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="space-y-4">
				<Collapsible open={showCustomization} onOpenChange={setShowCustomization}>
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							{showCustomization ? "Customize PR settings" : "Using default PR settings"}
						</p>
						<CollapsibleTrigger asChild>
							<Button variant="ghost" size="sm">
								{showCustomization ? (
									<ChevronUp className="h-4 w-4" />
								) : (
									<ChevronDown className="h-4 w-4" />
								)}
							</Button>
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent className="space-y-4 pt-4">
						<div className="grid gap-2">
							<Label htmlFor="branchName">Branch Name</Label>
							<Input
								id="branchName"
								value={branchName}
								onChange={(e) => setBranchName(e.target.value)}
								placeholder="feature/add-components"
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="commitMessage">Commit Message</Label>
							<Input
								id="commitMessage"
								value={commitMessage}
								onChange={(e) => setCommitMessage(e.target.value)}
								placeholder="Add Shadcn UI components"
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="prTitle">Pull Request Title</Label>
							<Input
								id="prTitle"
								value={prTitle}
								onChange={(e) => setPrTitle(e.target.value)}
								placeholder="Add Shadcn UI components"
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="prBody">Pull Request Description (optional)</Label>
							<Textarea
								id="prBody"
								value={prBody}
								onChange={(e) => setPrBody(e.target.value)}
								placeholder="Leave blank for auto-generated description"
								className="min-h-[100px]"
							/>
						</div>
					</CollapsibleContent>
				</Collapsible>

				<Button onClick={handleSubmit} disabled={isLoading || disabled} className="w-full">
					{isLoading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creating PR...
						</>
					) : (
						<>
							<Github className="mr-2 h-4 w-4" />
							Create Pull Request
						</>
					)}
				</Button>
			</div>

			<div className="transition-[height,opacity] duration-200 ease-in-out">
				{(error || progressMessages.length > 0 || success) && (
					<div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
						{error && (
							<Alert variant="destructive" className="mb-3">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{progressMessages.length > 0 && (
							<div className="space-y-2 text-sm">
								{progressMessages.map((message) => (
									<div key={message} className="flex items-center gap-2 text-muted-foreground">
										<div className="h-1.5 w-1.5 rounded-full bg-green-500" />
										{message}
									</div>
								))}
							</div>
						)}

						{success && (
							<Alert className="mt-3">
								<AlertDescription className="flex items-center gap-2">
									{success}
									{prUrl && (
										<Button
											variant="link"
											className="h-auto p-0"
											onClick={() => window.open(prUrl, "_blank")}
										>
											View PR
										</Button>
									)}
								</AlertDescription>
							</Alert>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
