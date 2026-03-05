import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthBranding } from "@/app/(app)/(authentication)/_components/auth-branding";
import { AuthForm } from "@/app/(app)/(authentication)/_components/auth-form";
import { Icon } from "@/components/assets/icon";
import { Divider } from "@/components/primitives/divider";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";
import { AuthenticationCard } from "@/app/(app)/(authentication)/_components/authentication-card";
import { SignUpForm } from "./_components/sign-up-form";

export const metadata: Metadata = constructMetadata({
	title: "Create Account",
	description: `Create your ${siteConfig.name} account to start building and deploying your applications.`,
});

export default async function SignUpPage() {
	const hasAuth = env.NEXT_PUBLIC_FEATURE_AUTH_ENABLED;
	const isGuestOnlyMode =
		!!env.NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED && !env.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED;

	/*
	 * Redirect to sign-in page when no authentication methods are available
	 * since users can create their own names through the guest form
	 */
	if (isGuestOnlyMode) {
		redirect(routes.auth.signIn);
	}

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
				<AuthForm mode="sign-up">
					{env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED && (
						<>
							<Divider text="Or continue with email" />
							<SignUpForm />
						</>
					)}
				</AuthForm>
			</AuthenticationCard>
		</div>
	);
}
