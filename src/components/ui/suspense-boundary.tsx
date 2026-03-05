"use client";

import { AlertCircle } from "lucide-react";
import * as React from "react";
import { Loader, type LoaderProps } from "@/components/primitives/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface SuspenseBoundaryProps extends React.PropsWithChildren {
	/**
	 * Custom loading props to pass to the loading component
	 */
	loadingProps?: LoaderProps;

	/**
	 * Whether to show a retry button when an error occurs
	 */
	showRetry?: boolean;

	/**
	 * Custom error component to show when an error occurs
	 */
	errorComponent?: React.ReactNode;

	/**
	 * Callback fired when the retry button is clicked
	 */
	onRetry?: () => void;
}

/**
 * A wrapper component that provides loading and error states for async components
 *
 * @example
 * ```tsx
 * <SuspenseBoundary>
 *   <MyAsyncComponent />
 * </SuspenseBoundary>
 * ```
 */
export const SuspenseBoundary = ({
	children,
	loadingProps,
	showRetry = true,
	errorComponent,
	onRetry,
}: SuspenseBoundaryProps) => {
	return (
		<React.Suspense fallback={<Loader {...loadingProps} />}>
			<ErrorBoundary
				fallback={errorComponent ?? <DefaultError onRetry={onRetry} showRetry={showRetry} />}
			>
				{children}
			</ErrorBoundary>
		</React.Suspense>
	);
};

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback: React.ReactNode;
}

class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	{ hasError: boolean; error: Error | null }
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// You can log the error to an error reporting service here
		console.error("Error caught by boundary:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}

		return this.props.children;
	}
}

interface DefaultErrorProps {
	onRetry?: () => void;
	showRetry?: boolean;
}

const DefaultError = ({ onRetry, showRetry }: DefaultErrorProps) => {
	return (
		<Alert variant="destructive">
			<AlertCircle className="h-4 w-4" />
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>
				Something went wrong while loading this content.
				{showRetry && (
					<Button
						variant="ghost"
						className="mt-2"
						onClick={() => {
							onRetry?.();
							window.location.reload();
						}}
					>
						Try again
					</Button>
				)}
			</AlertDescription>
		</Alert>
	);
};
