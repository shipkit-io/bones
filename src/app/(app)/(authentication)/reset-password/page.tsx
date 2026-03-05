import { AuthBranding } from "@/app/(app)/(authentication)/_components/auth-branding";
import type { Metadata } from "next";
import { AuthenticationCard } from "@/app/(app)/(authentication)/_components/authentication-card";
import { ResetPasswordForm } from "@/app/(app)/(authentication)/reset-password/_components/reset-password-form";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = constructMetadata({
	title: "Reset Password",
	description: `Create a new password for your ${siteConfig.name} account.`,
});

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	return (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<AuthBranding />
			<AuthenticationCard>
				<CardHeader>
					<CardTitle className="text-2xl">Reset Password</CardTitle>
					<CardDescription>Create a new password for your account</CardDescription>
				</CardHeader>
				<CardContent>
					<ResetPasswordForm token={resolvedSearchParams?.token} />
				</CardContent>
			</AuthenticationCard>
		</div>
	);
}
