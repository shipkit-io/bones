"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentPropsWithoutRef, type ReactNode, Suspense } from "react";
import { OAuthButtons } from "@/app/(app)/(authentication)/_components/oauth-buttons";
import { useIsModal } from "@/components/primitives/modal-context";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthForm } from "../_hooks/use-auth-form";
import { AuthFooter } from "./auth-footer";
import { AuthHeader } from "./auth-header";
import { buttonVariants } from "@/components/ui/button";

interface AuthFormProps extends ComponentPropsWithoutRef<"div"> {
	mode: "sign-in" | "sign-up";
	children?: ReactNode;
	title?: string;
	description?: string;
	withHeader?: boolean;
	withFooter?: boolean;
}

export function AuthForm({
	mode = "sign-in",
	className,
	children,
	title,
	description,
	withHeader = true,
	withFooter = true,
	...props
}: AuthFormProps) {
	const router = useRouter();
	const isModal = useIsModal();
	const {
		cardTitle,
		cardDescription,
		alternateLink,
		shouldShowAlternateLink,
		showAuthUnavailable,
	} = useAuthForm(mode, title, description);

	const handleAlternateLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		if (isModal) {
			e.preventDefault();
			// Use replace to avoid back-loop when navigating from modal
			router.replace(alternateLink.href);
		} else {
			// Signal to the modal intercepting route to not render
			// This prevents showing a modal when navigating between auth pages
			sessionStorage.setItem("skipAuthModal", "true");
		}
	};

	return (
		<div className={cn("flex flex-col gap-6 overflow-y-auto", className)} {...props}>
			{withHeader && (
				<AuthHeader
					title={cardTitle}
					description={cardDescription}
					showAuthUnavailable={showAuthUnavailable}
				/>
			)}
			<CardContent className={cn("pb-0", !withFooter && "pb-6")}>
				<div className="grid gap-6 relative">
					{showAuthUnavailable && (
						<div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
							<span aria-hidden="true">&gt;</span>
							<span>Login and sign-up are not available at this time.</span>
						</div>
					)}

					{!showAuthUnavailable && (
						<>
							<OAuthButtons collapsible variant="icons" />
							<Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
						</>
					)}
					{shouldShowAlternateLink && !showAuthUnavailable && (
						<div className="text-center text-sm">
							{alternateLink.text}{" "}
							<Link
								href={alternateLink.href}
								className={cn(buttonVariants({ variant: "link" }), "underline underline-offset-4 hover:no-underline hover:text-muted-foreground px-0")}
								onClick={handleAlternateLinkClick}
							>
								{alternateLink.label}
							</Link>
						</div>
					)}
				</div>
			</CardContent>
			{withFooter && <AuthFooter />}
		</div>
	);
}
