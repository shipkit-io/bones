"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingBar } from "@/components/ui/loading-bar";
import { Textarea } from "@/components/ui/textarea";
import { useWebGPUAvailability } from "@/lib/utils/webgpu";
import { Loader2, MessageSquare } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

function TypingAnimation({ simulate = false }: { simulate?: boolean }) {
	const [text, setText] = useState("Hi! I'm an AI assistant...");
	const dotCount = useRef<number>(0);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const animate = useCallback(() => {
		if (!simulate) return;

		dotCount.current = (dotCount.current + 1) % 4;
		const dots = ".".repeat(dotCount.current);
		setText(`Hi! I'm an AI assistant${dots}`);

		timeoutRef.current = setTimeout(animate, 500);
	}, [simulate]);

	useEffect(() => {
		if (simulate) {
			animate();
		}
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [animate, simulate]);

	return (
		<div className="flex min-h-[100px] items-start gap-3 rounded-lg bg-muted/50 p-4">
			<MessageSquare className="mt-0.5 h-5 w-5 text-muted-foreground/50" />
			<p className="text-sm text-muted-foreground">{text}</p>
		</div>
	);
}

export function AILandingDemo() {
	const isWebGPUAvailable = useWebGPUAvailability();
	const [input, setInput] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [output, setOutput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [hasAcceptedPermissions, setHasAcceptedPermissions] = useState(false);
	const [isLoadingModel, setIsLoadingModel] = useState(false);
	const [loadingMessage, setLoadingMessage] = useState("");
	const [progressItems, setProgressItems] = useState<Array<{ file: string; progress: number; total: number }>>([]);
	const worker = useRef<Worker | null>(null);
	const currentMessageRef = useRef<string>("");

	useEffect(() => {
		if (!worker.current && hasAcceptedPermissions) {
			setIsLoadingModel(true);
			worker.current = new Worker(
				new URL("@/app/(app)/landing/_components/worker.js", import.meta.url)
			);

			worker.current.postMessage({ type: "load" });

			worker.current.addEventListener("message", (e) => {
				const { status, output: workerOutput, data } = e.data;

				switch (status) {
					case "loading":
						setLoadingMessage(data);
						break;
					case "initiate":
						setProgressItems(prev => [...prev, e.data]);
						break;
					case "progress":
						setProgressItems(prev =>
							prev.map(item => {
								if (item.file === e.data.file) {
									return { ...item, ...e.data };
								}
								return item;
							})
						);
						break;
					case "done":
						setProgressItems(prev =>
							prev.filter(item => item.file !== e.data.file)
						);
						break;
					case "ready":
						setIsLoadingModel(false);
						setProgressItems([]);
						break;
					case "update":
						if (workerOutput) {
							setOutput(prev => prev + workerOutput);
						}
						break;
					case "complete":
						setIsProcessing(false);
						break;
					case "error": {
						console.error("Worker error:", e.data);
						const errorMessage = data?.error || "An error occurred while processing your request.";
						const errorType = data?.type || "unknown";

						switch (errorType) {
							case "webgpu_not_supported":
								setError("Your browser doesn't support WebGPU, which is required for this demo. Please try using Chrome Canary or another WebGPU-enabled browser.");
								break;
							case "model_load_failed":
								setError("Failed to load the AI model. Please try again or check your browser's WebGPU support.");
								break;
							case "generation_failed":
								setError("Failed to generate a response. Please try again.");
								break;
							case "initialization_failed":
								setError("Failed to initialize the AI model. Please try again or check your browser's WebGPU support.");
								break;
							default:
								setError(errorMessage);
						}

						setIsProcessing(false);
						setIsLoadingModel(false);
						break;
					}
				}
			});
		}

		return () => {
			if (worker.current) {
				worker.current.terminate();
				worker.current = null;
			}
		};
	}, [hasAcceptedPermissions]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim() || !worker.current || !hasAcceptedPermissions) return;

		setIsProcessing(true);
		setError(null);
		setOutput("");
		currentMessageRef.current = "";

		try {
			worker.current.postMessage({
				type: "generate",
				data: [{
					role: "user",
					content: input.trim()
				}]
			});
		} catch (err) {
			console.error("Error generating response:", err);
			setError("Failed to generate response. Please try again.");
			setIsProcessing(false);
		}
	};

	if (!isWebGPUAvailable) {
		return (
			<Card className="w-full max-w-2xl p-4 md:p-6">
				<div className="space-y-4 text-center">
					<h2 className="text-lg font-semibold">Browser Not Supported</h2>
					<p className="text-sm text-muted-foreground">
						Your browser doesn't support WebGPU, which is required for this demo.
						Please try using Chrome Canary or another WebGPU-enabled browser.
					</p>
				</div>
			</Card>
		);
	}

	if (!hasAcceptedPermissions) {
		return (
			<Card className="w-full max-w-2xl p-4 md:p-6">
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-lg font-semibold">AI Chat Demo</h2>
						<p className="text-sm text-muted-foreground">
							Chat with a powerful AI model that runs entirely in your browser. No servers, no data collection.
						</p>
					</div>

					<div className="space-y-4">
						<TypingAnimation simulate={true} />
					</div>

					<div className="flex flex-col space-y-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span className="flex h-6 w-6 items-center justify-center rounded-full border">1</span>
							<span>Downloads ~50MB model to your browser</span>
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span className="flex h-6 w-6 items-center justify-center rounded-full border">2</span>
							<span>Runs 100% locally - complete privacy</span>
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span className="flex h-6 w-6 items-center justify-center rounded-full border">3</span>
							<span>Works offline once loaded</span>
						</div>
					</div>

					<Button
						className="w-full"
						onClick={() => setHasAcceptedPermissions(true)}
					>
						Download & Run Live
					</Button>
				</div>
			</Card>
		);
	}

	if (isLoadingModel) {
		return (
			<>
				<LoadingBar />
				<Card className="w-full max-w-2xl p-4 md:p-6">
					<div className="flex flex-col items-center justify-center space-y-4">
						<div className="space-y-2 text-center">
							<h2 className="text-lg font-semibold">Loading AI Model</h2>
							<p className="text-sm text-muted-foreground">
								{loadingMessage}
							</p>
						</div>
						{progressItems.map(({ file, progress, total }) => (
							<div key={`${file}-${progress}`} className="w-full">
								<div className="mb-2 flex justify-between text-sm">
									<span className="text-muted-foreground">{file}</span>
									<span className="text-muted-foreground">
										{Math.round((progress / total) * 100)}%
									</span>
								</div>
								<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
									<div
										className="h-full bg-primary transition-all duration-500"
										style={{ width: `${(progress / total) * 100}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				</Card>
			</>
		);
	}

	return (
		<Card className="w-full max-w-2xl p-4 md:p-6">
			<form onSubmit={handleSubmit} className="space-y-4">
				<Textarea
					placeholder="Ask me anything..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					className="min-h-[100px] w-full resize-none"
					disabled={isProcessing || !hasAcceptedPermissions}
				/>

				<div className="flex items-center justify-between">
					<Button
						type="submit"
						disabled={!input.trim() || isProcessing || !hasAcceptedPermissions}
						className="w-full"
					>
						{isProcessing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Thinking...
							</>
						) : (
							"Ask AI"
						)}
					</Button>
				</div>

				{error && (
					<div className="text-sm text-red-500">{error}</div>
				)}

				{output && (
					<div className="mt-4 rounded-lg bg-muted p-4">
						<p className="whitespace-pre-wrap text-sm">{output}</p>
					</div>
				)}
			</form>
		</Card>
	);
}

