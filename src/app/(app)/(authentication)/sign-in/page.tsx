import type { Metadata } from "next";
import { AuthBranding } from "@/app/(app)/(authentication)/_components/auth-branding";
import { AuthenticationCard } from "@/app/(app)/(authentication)/_components/authentication-card";
import { SignIn } from "@/app/(app)/(authentication)/sign-in/_components/sign-in";
import { Icon } from "@/components/assets/icon";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";

export const metadata: Metadata = constructMetadata({
	title: "Sign In",
	description: `Sign in to your ${siteConfig.name} account to access your dashboard, projects, and settings.`,
});

export default function SignInPage() {
	const hasAuth = env.NEXT_PUBLIC_FEATURE_AUTH_ENABLED;

	if (!hasAuth) {
		return (
			<div className="flex w-full max-w-sm flex-col gap-6">
				<div className="flex items-center gap-2 self-center font-medium">
					<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
						<Icon />
					</div>
					{siteConfig.title}
				</div>
				<div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
					<span aria-hidden="true">&gt;</span>
					<span>Login and sign-up are not available at this time.</span>
				</div>
			</div>
		);
	}

	return (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<AuthBranding />
			<AuthenticationCard>
				<SignIn />
			</AuthenticationCard>
		</div>
	);
}
