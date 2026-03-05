"use client";

import { IconBrandVercelFilled } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { disconnectAccount, markVercelConnectionAttempt } from "@/server/actions/settings";
import type { User } from "@/types/user";
import { env } from "@/env";

interface VercelConnectButtonProps {
	className?: string;
	user?: User;
	/** Server-side connection status - preferred over checking session accounts */
	isConnected?: boolean;
}

export const VercelConnectButton = ({ className, user, isConnected: isConnectedProp }: VercelConnectButtonProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { toast: legacyToast } = useToast();

	// Use prop if provided, otherwise fall back to checking session accounts
	const hasVercelAccount = user?.accounts?.some((account) => account.provider === "vercel");
	const isConnected = isConnectedProp ?? !!hasVercelAccount;

	if (!env.NEXT_PUBLIC_FEATURE_VERCEL_INTEGRATION_ENABLED) {
		return null;
	}

	const handleConnect = async () => {
		try {
			setIsLoading(true);

			// Record the connection attempt in the database
			await markVercelConnectionAttempt();

			// the integration URL slug from vercel
			const client_slug = env.NEXT_PUBLIC_VERCEL_INTEGRATION_SLUG;

			// create a CSRF token and store it in a secure cookie
			const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			// Store CSRF token in a secure, httpOnly cookie (via server action would be better, but using JS for now)
			// Set SameSite=Lax to allow the OAuth redirect while preventing CSRF
			document.cookie = `vercel_oauth_state=${state}; path=/; SameSite=Lax; Secure; Max-Age=600`;

			// Get the origin for the callback URL
			const origin = window.location.origin;

			// Create the redirect URI
			const redirectUri = `${origin}/connect/vercel/auth`;

			// redirect the user to vercel with the callback URL
			// Use redirectUri as the parameter name for consistency with the OAuth spec
			const link = `https://vercel.com/integrations/${client_slug}/new?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
			window.location.assign(link);
		} catch (error) {
			legacyToast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to connect to Vercel",
				variant: "destructive",
			});
			setIsLoading(false);
		}
	};

	const handleDisconnect = async () => {
		if (isLoading) return;

		setIsLoading(true);
		try {
			const result = await disconnectAccount("vercel");

			if (!result.success) {
				toast.error(result.error ?? "Failed to disconnect Vercel account");
				return;
			}

			toast.success(result.message);

			// Refresh to update the UI with the new connection state
			router.refresh();
		} catch (error) {
			console.error("Disconnect Vercel error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			{isConnected ? (
				<div className={cn("flex flex-col items-center justify-center gap-1", className)}>
					<a
						href="https://vercel.com/dashboard"
						className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
						target="_blank"
						rel="noopener noreferrer"
					>
						<IconBrandVercelFilled className="mr-2 h-4 w-4" />
						View Vercel Dashboard
					</a>
					<Tooltip delayDuration={200}>
						<TooltipTrigger asChild>
							<Button
								onClick={handleDisconnect}
								variant="link"
								size="sm"
								disabled={isLoading}
								className="text-muted-foreground"
							>
								Disconnect from Vercel
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Remove Vercel account integration</p>
						</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<Button
					size="lg"
					onClick={() => void handleConnect()}
					disabled={isLoading}
					className={cn("", className)}
				>
					<IconBrandVercelFilled className="mr-2 h-4 w-4" />
					{isLoading ? "Connecting..." : "Connect Vercel"}
				</Button>
			)}
		</>
	);
};
