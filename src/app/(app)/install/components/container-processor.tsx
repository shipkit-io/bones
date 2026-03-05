"use client";

import { AlertTriangleIcon, CheckIcon, CodeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

interface ContainerProcessorProps {
	projectStructure: string;
	onComplete: (files: { path: string; content: string }[]) => void;
	onError: (error: string) => void;
}

export const ContainerProcessor = ({
	projectStructure,
	onComplete,
	onError,
}: ContainerProcessorProps) => {
	const [status, setStatus] = useState<string>("initializing");
	const [progress, setProgress] = useState<number>(0);
	const [files, setFiles] = useState<{ path: string; content: string }[]>([]);
	const [error, setError] = useState<string | null>(null);
	const processingRef = useRef(false);
	const [logs, setLogs] = useState<
		{ type: string; message: string; data?: any; timestamp: string }[]
	>([]);
	const [showLogs, setShowLogs] = useState(false);
	const logsRef = useRef<HTMLDivElement>(null);

	// Fetch logs periodically from window.webContainerLogs
	useEffect(() => {
		// Only run log collection when processing
		if (status === "completed" || status === "error") {
			return;
		}

		const logInterval = setInterval(() => {
			if (typeof window !== "undefined" && window.webContainerLogs) {
				setLogs([...window.webContainerLogs]);

				// Scroll to the bottom of the logs if visible
				if (showLogs && logsRef.current) {
					logsRef.current.scrollTop = logsRef.current.scrollHeight;
				}
			}
		}, 500);

		return () => clearInterval(logInterval);
	}, [status, showLogs]);

	useEffect(() => {
		// Skip if already completed or errored
		if (status === "completed" || status === "error") {
			return;
		}

		// Prevent double execution from React's strict mode
		if (processingRef.current) {
			return;
		}

		// Set processing flag to prevent multiple executions
		processingRef.current = true;

		// Clear previous logs
		if (typeof window !== "undefined") {
			window.webContainerLogs = [];
		}
		setLogs([]);

		const processTemplate = async () => {
			try {
				setStatus("initializing");
				setProgress(10);

				setStatus("loading-container");
				setProgress(20);

				// Dynamically import the container manager to avoid SSR issues
				const { containerManager } = await import("../container-utils");
				if (!containerManager) {
					throw new Error("WebContainer is only available in browser environments");
				}

				setStatus("initializing-container");
				setProgress(30);

				// Initialize the container
				await containerManager.boot();

				setStatus("installing-template");
				setProgress(60);

				// Install the shadcn template
				const result = await containerManager.installShadcnTemplate(projectStructure);

				setStatus("processing-files");
				setProgress(80);

				// Set the files and complete
				setFiles(result);
				setStatus("completed");
				setProgress(100);

				// Call the onComplete callback
				onComplete(result);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
				setError(errorMessage);
				setStatus("error");
				onError(errorMessage);
			} finally {
				// Reset processing flag when done
				processingRef.current = false;
			}
		};

		processTemplate();

		// Cleanup function
		return () => {
			// No cleanup needed, we're using the ref to track state
		};
	}, [projectStructure, onComplete, onError, status]);

	if (status === "error") {
		return (
			<Alert variant="destructive">
				<AlertTriangleIcon className="h-4 w-4" />
				<AlertTitle>Error</AlertTitle>
				<AlertDescription className="space-y-4">
					<p>{error}</p>
					{logs.length > 0 && (
						<Collapsible open={showLogs} onOpenChange={setShowLogs} className="space-y-2">
							<CollapsibleTrigger asChild>
								<Button variant="outline" size="sm" className="flex items-center">
									<CodeIcon className="h-4 w-4 mr-2" />
									{showLogs ? "Hide Logs" : "Show Logs"}
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<div
									ref={logsRef}
									className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs max-h-96 overflow-y-auto"
								>
									{logs.map((log, index) => (
										<div key={`log-${index}-${log.timestamp}`} className="pb-1">
											<span className="text-slate-400">
												[{new Date(log.timestamp).toLocaleTimeString()}]
											</span>{" "}
											<span
												className={
													log.message.includes("prompt") ? "text-yellow-400 font-medium" : ""
												}
											>
												{log.message}
											</span>
											{log.data && typeof log.data === "string" && (
												<pre
													className={`whitespace-pre-wrap break-words pl-6 mt-1 ${
														log.data.includes("Ok to proceed?") ||
														log.data.includes("Need to install")
															? "text-yellow-300"
															: log.data.includes("y\n") || log.data.includes("responding")
																? "text-green-400"
																: "text-green-400"
													}`}
												>
													{log.data}
												</pre>
											)}
										</div>
									))}
								</div>
							</CollapsibleContent>
						</Collapsible>
					)}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{status === "completed" ? (
						<div className="flex items-center">
							<CheckIcon className="h-5 w-5 mr-2 text-green-500" />
							Template Processing Complete
						</div>
					) : (
						`Processing Template (${status.replace(/-/g, " ")})`
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Progress value={progress} className="h-2 mb-2" />
				<p className="text-sm text-muted-foreground">
					{status === "initializing" && "Setting up environment..."}
					{status === "loading-container" && "Loading WebContainer..."}
					{status === "initializing-container" && "Initializing container..."}
					{status === "installing-template" &&
						"Installing shadcn template in a virtual environment..."}
					{status === "processing-files" && "Processing generated files..."}
					{status === "completed" && "Template successfully processed!"}
				</p>

				{/* Log display */}
				{logs.length > 0 && (
					<div className="mt-4">
						<Collapsible open={showLogs} onOpenChange={setShowLogs} className="space-y-2">
							<CollapsibleTrigger asChild>
								<Button variant="outline" size="sm" className="flex items-center">
									<CodeIcon className="h-4 w-4 mr-2" />
									{showLogs ? "Hide Logs" : "Show Logs"}
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<div
									ref={logsRef}
									className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs max-h-96 overflow-y-auto mt-2"
								>
									{logs.map((log, index) => (
										<div key={`log-${index}-${log.timestamp}`} className="pb-1">
											<span className="text-slate-400">
												[{new Date(log.timestamp).toLocaleTimeString()}]
											</span>{" "}
											<span
												className={
													log.message.includes("prompt") ? "text-yellow-400 font-medium" : ""
												}
											>
												{log.message}
											</span>
											{log.data && typeof log.data === "string" && (
												<pre
													className={`whitespace-pre-wrap break-words pl-6 mt-1 ${
														log.data.includes("Ok to proceed?") ||
														log.data.includes("Need to install")
															? "text-yellow-300"
															: log.data.includes("y\n") || log.data.includes("responding")
																? "text-green-400"
																: "text-green-400"
													}`}
												>
													{log.data}
												</pre>
											)}
										</div>
									))}
								</div>
							</CollapsibleContent>
						</Collapsible>
					</div>
				)}
			</CardContent>
			{status === "completed" && (
				<CardFooter>
					<p className="text-sm">{files.length} files were processed and are ready for preview.</p>
				</CardFooter>
			)}
		</Card>
	);
};
