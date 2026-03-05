"use client";

import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { cva } from "class-variance-authority";
import { useState } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/assets/icons";
import {
	useBetterAuthEnabled,
	useBetterAuthProviders,
} from "@/components/providers/better-auth-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { socialSignIn } from "@/lib/better-auth/client";
import { cn } from "@/lib/utils";

const oauthButtonVariants = cva("flex items-center justify-center gap-sm", {
	variants: {
		variant: {
			default: "w-full",
			icons: "w-auto p-2",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

interface BetterAuthOAuthButtonsProps {
	variant?: "default" | "icons";
	className?: string;
}

interface ProviderConfig {
	id: string;
	name: string;
	icon: React.ReactNode;
}

const providerConfigs: Record<string, ProviderConfig> = {
	google: {
		id: "google",
		name: "Google",
		icon: <Icons.google className="h-4 w-4" />,
	},
	github: {
		id: "github",
		name: "GitHub",
		icon: <GitHubLogoIcon className="h-4 w-4" />,
	},
	discord: {
		id: "discord",
		name: "Discord",
		icon: <DiscordLogoIcon className="h-4 w-4" />,
	},
};

/**
 * Better Auth OAuth Buttons Component
 *
 * This component renders OAuth sign-in buttons for Better Auth providers.
 * It only renders when Better Auth is enabled and configured providers are available.
 */
export function BetterAuthOAuthButtons({
	variant = "default",
	className,
}: BetterAuthOAuthButtonsProps) {
	const isBetterAuthEnabled = useBetterAuthEnabled();
	const availableProviders = useBetterAuthProviders();
	const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

	// Don't render if Better Auth is not enabled or no providers available
	if (!isBetterAuthEnabled || availableProviders.length === 0) {
		return null;
	}

	const handleSignIn = async (providerId: string) => {
		try {
			setLoadingProvider(providerId);

			// Use Better Auth social sign-in
			switch (providerId) {
				case "google":
					await socialSignIn.google();
					break;
				case "github":
					await socialSignIn.github();
					break;
				case "discord":
					await socialSignIn.discord();
					break;
				default:
					throw new Error(`Unsupported provider: ${providerId}`);
			}
		} catch (error) {
			console.error("Better Auth: Sign-in failed", error);
			toast.error(`Failed to sign in with ${providerConfigs[providerId]?.name || providerId}`);
		} finally {
			setLoadingProvider(null);
		}
	};

	return (
		<div
			className={cn(
				"flex gap-xs w-full",
				variant === "icons" ? "flex-row justify-center" : "flex-col items-stretch",
				className
			)}
		>
			{availableProviders.map((providerId) => {
				const config = providerConfigs[providerId];
				if (!config) return null;

				const isLoading = loadingProvider === providerId;

				const button = (
					<Button
						variant="outline"
						type="button"
						onClick={() => handleSignIn(providerId)}
						disabled={isLoading}
						className={oauthButtonVariants({ variant })}
					>
						{variant === "default" && (
							<span>{isLoading ? "Signing in..." : `Sign in with ${config.name}`}</span>
						)}
						{config.icon}
					</Button>
				);

				return (
					<div key={providerId}>
						{variant === "icons" ? (
							<Tooltip>
								<TooltipTrigger asChild>{button}</TooltipTrigger>
								<TooltipContent>
									<p>Sign in with {config.name}</p>
								</TooltipContent>
							</Tooltip>
						) : (
							button
						)}
					</div>
				);
			})}
		</div>
	);
}
