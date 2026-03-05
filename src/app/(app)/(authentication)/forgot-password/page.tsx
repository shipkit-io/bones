import { AuthBranding } from "@/app/(app)/(authentication)/_components/auth-branding";
import type { Metadata } from "next";
import { AuthenticationCard } from "../_components/authentication-card";
import { ForgotPasswordForm } from "@/app/(app)/(authentication)/forgot-password/_components/forgot-password-form";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = constructMetadata({
	title: "Forgot Password",
	description: `Reset your ${siteConfig.name} account password. Enter your email to receive a password reset link.`,
});

export default function ForgotPasswordPage() {
	return (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<AuthBranding />
			<AuthenticationCard>
				<CardHeader>
					<CardTitle className="text-2xl">Forgot Password</CardTitle>
					<CardDescription>Enter your email below to reset your password</CardDescription>
				</CardHeader>
				<CardContent>
					<ForgotPasswordForm />
				</CardContent>
			</AuthenticationCard>
		</div>
	);
}
