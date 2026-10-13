import type { Metadata } from "next";
import { Suspense } from "react";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { AuthErrorContent } from "./_components/auth-error-content";

export const metadata: Metadata = constructMetadata({
  title: "Authentication Error",
  description: `Something went wrong while signing you in to ${siteConfig.name}. Try the sign-in step again, or contact support if the problem keeps happening.`,
  noIndex: true,
});

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
