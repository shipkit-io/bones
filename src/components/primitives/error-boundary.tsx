"use client";

import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/config/routes";
import { STATUS_CODES } from "@/config/status-codes";
import { AuthenticationError } from "@/lib/errors/authentication-error";
import { logger } from "@/lib/logger";
import { redirect } from "@/lib/utils/redirect";

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
	isServerActionError: boolean;
	isProxyError: boolean;
	retryCount: number;
}

function isReactServerActionError(error: Error): boolean {
	const errorString = error.toString().toLowerCase();
	const message = error.message?.toLowerCase() || "";
	const stack = error.stack?.toLowerCase() || "";

	const serverActionIndicators = [
		"#418",
		"server action",
		"action failed",
		"form action",
		"unexpected response was received from the server",
		"minified react error",
		"server component",
		"rsc_error",
	];

	return serverActionIndicators.some(
		(indicator) =>
			errorString.includes(indicator) || message.includes(indicator) || stack.includes(indicator)
	);
}

function isProxyBlockingError(error: Error): boolean {
	const errorString = error.toString().toLowerCase();
	const message = error.message?.toLowerCase() || "";
	const stack = error.stack?.toLowerCase() || "";

	const proxyIndicators = [
		"403",
		"forbidden",
		"proxy",
		"blocked",
		"filtered",
		"corporate",
		"network policy",
		"access denied",
		"security policy",
		"cors",
		"cross-origin",
	];

	return proxyIndicators.some(
		(indicator) =>
			errorString.includes(indicator) || message.includes(indicator) || stack.includes(indicator)
	);
}

const DefaultFallback: React.FC<{
	error: Error;
	retry: () => void;
	isProxyError: boolean;
	retryCount: number;
}> = ({ error, retry, isProxyError, retryCount }) => {
	const [isRetrying, setIsRetrying] = React.useState(false);

	const handleRetry = async () => {
		setIsRetrying(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief delay
			retry();
		} finally {
			setIsRetrying(false);
		}
	};

	const getErrorTitle = () => {
		if (isProxyError) {
			return "Network Security Restriction";
		}
		return "Action Failed";
	};

	const getErrorDescription = () => {
		if (isProxyError) {
			return "This action was blocked by your network security settings. This is common in corporate environments.";
		}
		return "The requested action could not be completed due to a server error.";
	};

	const getErrorSolution = () => {
		if (isProxyError) {
			return [
				"Contact your IT administrator to allow this domain",
				"Try using a different network (e.g., mobile hotspot)",
				"Use the browser's incognito/private mode",
				"Clear your browser cache and cookies",
			];
		}
		return [
			"Try again in a few moments",
			"Check your internet connection",
			"Refresh the page and try again",
		];
	};

	return (
		<Card className="border-destructive/50 bg-destructive/5">
			<CardHeader>
				<div className="flex items-center gap-2">
					{isProxyError ? (
						<WifiOff className="h-5 w-5 text-destructive" />
					) : (
						<AlertTriangle className="h-5 w-5 text-destructive" />
					)}
					<CardTitle className="text-destructive">{getErrorTitle()}</CardTitle>
					{isProxyError && (
						<Badge variant="secondary" className="text-xs">
							Proxy Blocked
						</Badge>
					)}
				</div>
				<CardDescription>{getErrorDescription()}</CardDescription>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="space-y-2">
					<h4 className="text-sm font-medium">Suggested solutions:</h4>
					<ul className="text-sm text-muted-foreground space-y-1">
						{getErrorSolution().map((solution, index) => (
							<li key={index} className="flex items-start gap-2">
								<span className="text-xs mt-1">•</span>
								<span>{solution}</span>
							</li>
						))}
					</ul>
				</div>

				<div className="flex items-center gap-2">
					<Button
						onClick={handleRetry}
						disabled={isRetrying}
						variant="outline"
						size="sm"
						className="min-w-24"
					>
						{isRetrying ? (
							<>
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								Retrying...
							</>
						) : (
							<>
								<RefreshCw className="h-4 w-4 mr-2" />
								Try Again
							</>
						)}
					</Button>

					{retryCount > 0 && (
						<Badge variant="outline" className="text-xs">
							Attempt {retryCount + 1}
						</Badge>
					)}
				</div>

				<details className="text-xs">
					<summary className="cursor-pointer text-muted-foreground hover:text-foreground">
						Technical Details
					</summary>
					<pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">{error.message}</pre>
				</details>
			</CardContent>
		</Card>
	);
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			isServerActionError: false,
			isProxyError: false,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		const isServerActionError = isReactServerActionError(error);
		const isProxyError = isProxyBlockingError(error);

		return {
			hasError: true,
			error,
			isServerActionError,
			isProxyError,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.setState({ errorInfo });

		if (error instanceof AuthenticationError) {
			logger.info("ErrorBoundary: Authentication error, redirecting to sign in");
			// Cannot use hooks in class components - use direct redirect with hardcoded path
			// Get current path from window.location for nextUrl parameter
			const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
			redirect(routes.auth.signIn, {
				code: STATUS_CODES.AUTH.code,
				nextUrl: currentPath,
			});
		}

		logger.error("ErrorBoundary caught an error:", error, errorInfo);

		this.props.onError?.(error, errorInfo);

		if (this.state.isServerActionError) {
			if (this.state.isProxyError) {
				toast.error("Action blocked by network security. Please contact your IT administrator.", {
					duration: 5000,
				});
			} else {
				toast.error("Server action failed. Please try again.", { duration: 3000 });
			}
		}
	}

	retry = () => {
		this.setState((prevState) => ({
			hasError: false,
			error: null,
			errorInfo: null,
			isServerActionError: false,
			isProxyError: false,
			retryCount: prevState.retryCount + 1,
		}));
	};

	render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				const FallbackComponent = this.props.fallback;
				return <FallbackComponent error={this.state.error} retry={this.retry} />;
			}

			return (
				<DefaultFallback
					error={this.state.error}
					retry={this.retry}
					isProxyError={this.state.isProxyError}
					retryCount={this.state.retryCount}
				/>
			);
		}

		return this.props.children;
	}
}
