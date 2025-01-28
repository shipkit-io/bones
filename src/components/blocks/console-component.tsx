"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { routes } from "@/config/routes";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ConsoleComponentProps {
	onCreateTestKey: () => Promise<string>;
	apiKey: string | null;
}

export function ConsoleComponent({
	onCreateTestKey,
	apiKey,
}: ConsoleComponentProps) {
	const [isRunning, setIsRunning] = useState(true);
	const [logs, setLogs] = useState<string[]>([]);

	const isActive = isRunning && apiKey;

	useEffect(() => {
		if (isActive) {
			const eventSource = new EventSource(`${routes.api.sse}?key=${apiKey}`);

			eventSource.onmessage = (event) => {
				const newLog = JSON.parse(event.data);
				setLogs((prevLogs) => [
					...prevLogs,
					`${new Date(newLog.timestamp).toLocaleTimeString()} - ${newLog.level.toUpperCase()}: ${newLog.message}`,
				]);
			};

			eventSource.onerror = (error) => {
				console.error("SSE error:", error);
				eventSource.close();
				setIsRunning(false);
			};

			return () => {
				eventSource.close();
			};
		}
	}, [apiKey, isActive]);

	const handleStart = async () => {
		if (!apiKey) {
			await onCreateTestKey();
		}
		setIsRunning(true);
		setLogs([]);
	};

	const sendTestLog = async () => {
		if (!apiKey) return;
		try {
			await fetch("/api/send-test-log", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ apiKey }),
			});
		} catch (error) {
			console.error("Error sending test log:", error);
		}
	};

	return (
		<div className="relative mx-auto mt-10 w-full max-w-screen-sm text-inherit">
			<div className="overflow-hidden rounded-lg bg-gray-800 shadow-xl">
				{/* Mac-style chrome */}
				<div className="flex items-center justify-between bg-gray-700 px-4 py-2">
					<div className="flex space-x-2">
						<div className="h-3 w-3 rounded-full bg-red-500" />
						<div className="h-3 w-3 rounded-full bg-yellow-500" />
						<div className="h-3 w-3 rounded-full bg-green-500" />
					</div>
					<div className="text-sm text-gray-400">Console</div>
				</div>

				{/* Console content */}
				<div className="relative h-80 bg-gray-900 p-4">
					{isActive ? (
						<ScrollArea className="h-full">
							<AnimatePresence initial={false}>
								{logs.length > 0 ? (
									logs.map((log, index) => (
										<motion.div
											key={log}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.5 }}
											className="mb-2 text-green-400"
										>
											{log}
										</motion.div>
									))
								) : (
									<div className="text-center text-gray-400 opacity-80">
										Waiting for logs...
										<br />
										<Button
											variant="link"
											className="text-xs text-gray-400 underline opacity-80 hover:text-gray-300"
											onClick={sendTestLog}
										>
											Send a test log
										</Button>
									</div>
								)}
							</AnimatePresence>
						</ScrollArea>
					) : (
						<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
							<Button onClick={handleStart} variant="outline">
								{apiKey ? "Start Console" : "Live Demo"}
							</Button>
						</div>
					)}

					{/* Sonar-like pulse animation */}
					{isActive && (
						<Button
							onClick={sendTestLog}
							variant="outline"
							size="sm"
							className="absolute bottom-4 left-4"
						>
							Send Test Log
						</Button>
					)}
					{isRunning && (
						<motion.div
							className="absolute bottom-4 right-4 h-4 w-4 rounded-full bg-green-500"
							animate={{
								scale: [1, 1.5, 1],
								opacity: [0.7, 0.3, 0.7],
							}}
							transition={{
								duration: 2,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
