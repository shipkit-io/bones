import type { Metadata } from "next";
import { AuthBranding } from "@/app/(app)/(authentication)/_components/auth-branding";
import { AuthenticationCard } from "@/app/(app)/(authentication)/_components/authentication-card";
import { ResetPasswordForm } from "@/app/(app)/(authentication)/reset-password/_components/reset-password-form";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = constructMetadata({
  title: "Reset Password",
  description: `Finish resetting your ${siteConfig.name} account password. Choose a new password you have not used before and sign back in to your dashboard.`,
  noIndex: true,
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
