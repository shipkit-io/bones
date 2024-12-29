"use client";

import { Icons } from "@/components/images/icons";
import { Button } from "@/components/ui/button";
import { signInWithOAuthAction } from "@/server/actions/auth";
import { providerMap } from "@/server/auth.providers";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";

export function OAuthButtons() {
	const handleSignIn = (providerId: string) => {
		void signInWithOAuthAction({ providerId });
	};

	return (
		<div className="flex flex-col gap-2">
			{Object.values(providerMap).map((provider: any) => {
				if (!provider?.name) {
					return null;
				}
				const { name } = provider;

				if (!name || String(name).toLowerCase() === "credentials") {
					return null;
				}

				return (
					<form
						key={provider.id}
						action={() => {
							handleSignIn(provider.id);
						}}
					>
						<Button
							variant={"outline"}
							type="submit"
							className="flex w-full items-center justify-center gap-sm"
						>
							<span>Sign in with {provider.name}</span>
							{provider.name === "GitHub" && (
								<GitHubLogoIcon className="h-4 w-4" />
							)}
							{provider.name === "Discord" && (
								<DiscordLogoIcon className="h-4 w-4" />
							)}
							{provider.name === "Google" && (
								<Icons.google className="h-4 w-4" />
							)}
						</Button>
					</form>
				);
			})}
		</div>
	);
}
