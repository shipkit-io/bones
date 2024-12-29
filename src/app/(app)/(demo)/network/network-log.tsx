"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, SearchIcon, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

type LogLevel = "info" | "warning" | "error" | "success";
type RequestType = "fetch" | "xmlhttprequest" | "other";
type RequestStatus = "pending" | "success" | "error";

interface NetworkRequest {
	id: string;
	name: string;
	status: RequestStatus;
	type: RequestType | string;
	size: string;
	time: number;
	level?: LogLevel;
}

const networkLogVariants = cva(
	// Base styles
	"overflow-hidden rounded-lg shadow-2xl",
	{
		variants: {
			variant: {
				default: "bg-[#1a0f2e]",
				modern: "bg-gray-900 bg-opacity-40 backdrop-blur-xl border border-gray-700 rounded-3xl",
			},
			size: {
				default: "w-full max-w-4xl",
				compact: "w-full max-w-md",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

const formatBytes = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`;
};

const StatusIndicator = ({
	status,
}: {
	status: RequestStatus;
}) => {
	const baseClasses = "h-2 w-2 rounded-full";
	const statusClasses = {
		pending: "bg-blue-400",
		success: "bg-green-400",
		error: "bg-red-400",
	};

	return (
		<motion.div
			className={cn(baseClasses, statusClasses[status])}
			animate={status === "pending" ? { scale: [1, 1.2, 1] } : {}}
			transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
		/>
	);
};

interface NetworkLogProps extends VariantProps<typeof networkLogVariants> {
	className?: string;
	showSearch?: boolean;
	showRefresh?: boolean;
	simulateRequests?: boolean;
}

export const NetworkLog = ({
	variant,
	size,
	className,
	showSearch = false,
	showRefresh = true,
	simulateRequests = false,
}: NetworkLogProps) => {
	const [requests, setRequests] = useState<NetworkRequest[]>([]);
	const [isOnline, setIsOnline] = useState(true);
	const [isSearchOpen, setIsSearchOpen] = useState(showSearch);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const updateOnlineStatus = () => setIsOnline(navigator?.onLine ?? true);
		window.addEventListener("online", updateOnlineStatus);
		window.addEventListener("offline", updateOnlineStatus);

		if ("PerformanceObserver" in window) {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.entryType === "resource") {
						const request: NetworkRequest = {
							id: Math.random().toString(36).slice(2, 9),
							name: entry.name,
							status: entry.duration > 0 ? "success" : "error",
							type: (entry as PerformanceResourceTiming).initiatorType,
							size: formatBytes(
								(entry as PerformanceResourceTiming).transferSize,
							),
							time: Math.round(entry.duration),
							level: entry.duration > 1000 ? "warning" : "info",
						};
						setRequests((prev) => [request, ...prev.slice(0, 9)]);
					}
				}
			});

			observer.observe({ entryTypes: ["resource"] });

			return () => {
				observer.disconnect();
				window.removeEventListener("online", updateOnlineStatus);
				window.removeEventListener("offline", updateOnlineStatus);
			};
		}

		if (simulateRequests) {
			const interval = setInterval(() => {
				const simulatedRequest: NetworkRequest = {
					id: Math.random().toString(36).slice(2, 9),
					name: `/api/endpoint${Math.floor(Math.random() * 100)}`,
					status: Math.random() > 0.8 ? "error" : "success",
					type: Math.random() > 0.5 ? "fetch" : "xmlhttprequest",
					size: formatBytes(Math.floor(Math.random() * 1000000)),
					time: Math.floor(Math.random() * 1000),
				};
				setRequests((prev) => [simulatedRequest, ...prev.slice(0, 9)]);
			}, 2000);

			return () => {
				clearInterval(interval);
				window.removeEventListener("online", updateOnlineStatus);
				window.removeEventListener("offline", updateOnlineStatus);
			};
		}
	}, [simulateRequests]);

	useEffect(() => {
		setIsSearchOpen(showSearch);
	}, [showSearch]);

	const handleSearchToggle = () => {
		setIsSearchOpen(!isSearchOpen);
	};

	const filteredRequests = searchQuery
		? requests.filter((request) =>
			request.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: requests;

	return (
		<div className={cn(networkLogVariants({ variant, size }), className)}>
			<div className="flex items-center justify-between border-b border-gray-700 p-4">
				<div className="flex items-center space-x-2">
					<h2 className={cn(
						"font-semibold",
						variant === "modern" ? "text-xl text-white" : "text-gray-400"
					)}>
						Network Activity
					</h2>
				</div>
				<div className="flex items-center space-x-4">
					<Button
						variant="ghost"
						size="icon"
						className={cn(
							"hover:bg-black/20",
							isSearchOpen && "bg-black/20"
						)}
						onClick={handleSearchToggle}
					>
						<SearchIcon className="h-5 w-5 text-gray-400" />
					</Button>
					{isOnline ? (
						<Wifi className="h-5 w-5 text-green-400" />
					) : (
						<WifiOff className="h-5 w-5 text-red-400" />
					)}
				</div>
			</div>

			<div className="p-4">
				<AnimatePresence>
					{isSearchOpen && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2 }}
							className="relative mb-4 overflow-hidden"
						>
							<SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search requests..."
								className="w-full rounded-lg bg-gray-800 bg-opacity-50 py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</motion.div>
					)}
				</AnimatePresence>

				<div className="space-y-2">
					<AnimatePresence initial={false}>
						{filteredRequests.length > 0 ? (
							filteredRequests.map((request) => (
								<motion.div
									key={request.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
									className={cn(
										"flex items-center justify-between rounded-lg p-3 text-sm",
										variant === "modern"
											? "bg-gray-800 bg-opacity-50 text-gray-300"
											: "bg-gray-800/50 text-gray-300"
									)}
								>
									<div className="flex items-center space-x-3">
										<StatusIndicator status={request.status} />
										<span className="max-w-[150px] truncate font-medium">
											{request.name}
										</span>
									</div>
									<div className="flex space-x-4 text-xs text-gray-400">
										<span>{request.type}</span>
										<span>{request.size}</span>
										<span>{request.time}ms</span>
									</div>
								</motion.div>
							))
						) : (
							<div className="text-center animate-pulse">
								<p className="text-muted-foreground/60">Waiting for requests...</p>
							</div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{showRefresh && (
				<button
					type="button"
					className="w-full text-blue-400 hover:text-blue-300 flex items-center justify-center bg-gray-800 bg-opacity-30 py-4"
					onClick={() => setRequests([])}
				>
					<RefreshCw className="mr-2 h-5 w-5" />
					Refresh
				</button>
			)}
		</div>
	);
};
