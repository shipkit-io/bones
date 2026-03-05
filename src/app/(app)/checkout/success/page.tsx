import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";
import { LoginButton } from "@/components/buttons/sign-in-button";
import { Link } from "@/components/primitives/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfettiSideCannons } from "@/components/ui/magicui/confetti/confetti-side-cannons";
import { SparklesCore } from "@/components/ui/sparkles";

import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";
import { PaymentService } from "@/server/services/payment-service";

export const metadata: Metadata = constructMetadata({
	title: "Purchase Successful",
	description: `Thank you for your purchase! Get started with ${siteConfig.name} and begin building your application.`,
	noIndex: true,
});

interface SearchParams {
	// Lemon Squeezy parameters
	order_id?: string;
	order_number?: string;
	order_key?: string;
	product_id?: string;
	variant_id?: string;
	customer_id?: string;
	test_mode?: string;
	status?: string;
	email?: string;
	name?: string;
	custom_data?: string;

	// Polar parameters
	checkoutId?: string;
	customer_session_token?: string;

	// Common/generic
	[key: string]: string | undefined;
}

interface CustomData {
	user_id?: string;
	user_email?: string;
	[key: string]: unknown;
}

interface PageProps {
	searchParams: Promise<SearchParams>;
}

export default async function CheckoutSuccessPage({
	searchParams: searchParamsPromise,
}: PageProps) {
	const searchParams = await searchParamsPromise;
	const session = await auth();
	const requestId = crypto.randomUUID();
	let customData: CustomData = {};
	let accessGranted = false;
	let canDownload = false;
	let paymentProcessor = "unknown";
	let orderId = "";
	let email = "";
	let status = "";

	logger.info("Checkout success page loaded", {
		requestId,
		userId: session?.user?.id,
		userEmail: session?.user?.email,
		timestamp: new Date().toISOString(),
		searchParams,
	});

	try {
		// Determine which payment processor was used
		if (searchParams.order_id) {
			// Lemon Squeezy checkout
			paymentProcessor = "lemon-squeezy";
			orderId = searchParams.order_id;
			email = searchParams.email || "";
			status = searchParams.status || "completed";

			logger.info("Lemon Squeezy checkout detected", {
				requestId,
				orderId,
				email,
				status,
			});

			// Process Lemon Squeezy custom data
			if (searchParams.custom_data) {
				try {
					customData = JSON.parse(searchParams.custom_data) as CustomData;
					logger.info("Parsed Lemon Squeezy custom data", {
						requestId,
						customData,
					});
				} catch (error) {
					logger.error("Error parsing Lemon Squeezy custom data", {
						requestId,
						error: error instanceof Error ? error.message : String(error),
						rawCustomData: searchParams.custom_data,
					});
				}
			}

			// Check if download is possible for Lemon Squeezy
			if (orderId && email && status === "paid") {
				canDownload = true;
				logger.info("Download enabled for Lemon Squeezy purchase", {
					requestId,
					orderId,
					email,
				});
			}
		} else if (searchParams.checkoutId) {
			// Polar checkout
			paymentProcessor = "polar";
			orderId = searchParams.checkoutId;
			// We don't have email directly from Polar, use user email if available
			email = session?.user?.email || "";
			status = "completed"; // Assume completed if we got redirected to success page

			logger.info("Polar checkout detected", {
				requestId,
				checkoutId: orderId,
				customer_session_token: searchParams.customer_session_token,
			});

			// Enable download if user is logged in (since we have their email)
			if (orderId && session?.user?.email) {
				canDownload = true;
				logger.info("Download enabled for Polar purchase", {
					requestId,
					orderId,
					email: session.user.email,
				});
			}
		}

		// Grant access if possible (works for both payment processors)
		if (orderId && (session?.user?.id || customData.user_id)) {
			try {
				await PaymentService.createPayment({
					userId: session?.user?.id || customData.user_id!,
					orderId: orderId,
					status: status,
					amount: 0,
					processor: paymentProcessor,
					metadata: JSON.stringify({
						searchParams,
						customData,
						paymentProcessor,
						test_mode: searchParams.test_mode === "true",
					}) as unknown as Record<string, unknown>,
				});

				accessGranted = true;
				logger.info("Access granted successfully", {
					requestId,
					orderId,
					userId: session?.user?.id || customData.user_id,
					paymentProcessor,
				});
			} catch (error) {
				logger.error("Error granting access", {
					requestId,
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					paymentProcessor,
				});
			}
		}
	} catch (error) {
		logger.error("Error processing checkout success", {
			requestId,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			searchParams,
		});
	}

	return (
		<>
			<ConfettiSideCannons />
			<div className="relative min-h-screen w-full bg-background">
				{/* Sparkles background */}
				<div className="absolute inset-0 h-full w-full">
					<SparklesCore
						background="transparent"
						minSize={0.6}
						maxSize={1.4}
						particleDensity={40}
						className="h-full w-full"
						particleColor="#00C9A7"
					/>
				</div>

				{/* Content */}
				<div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-20">
					<h1 className="mb-8 text-center text-xl font-bold">Success!</h1>
					<div className="mb-8 text-center">
						<h2 className="mb-2 text-4xl font-semibold">Welcome aboard</h2>
						<p className="text-muted-foreground">
							Your purchase was successful, we can't wait to see what you build.
						</p>
						{accessGranted && (
							<p className="mt-2 text-sm text-green-500">✓ Access granted successfully</p>
						)}
					</div>

					{session ? (
						// Logged in state
						<Card className="mb-8 w-full max-w-md p-6 text-center">
							<p className="mb-4">
								Your account is ready to go! Head to the dashboard to get started.
							</p>
							<Button asChild size="lg" className="w-full">
								<Link href={routes.app.dashboard}>Go to Dashboard</Link>
							</Button>
						</Card>
					) : (
						<LoginButton />
					)}

					{canDownload && email && (
						<div className="mt-20 text-center">
							<h3 className="mb-4 text-lg font-semibold">Just want the code?</h3>
							{/* Download button - direct link with email param */}
							<Button variant="outline" size="lg" className={cn("w-full")} asChild>
								<Link href={`${routes.api.download}?email=${encodeURIComponent(email)}`}>
									<DownloadIcon className="mr-2 h-4 w-4" />
									Download {siteConfig.title}
								</Link>
							</Button>
						</div>
					)}

					{/* Additional resources */}
					<div className="mt-20 text-center">
						<h3 className="mb-4 text-lg font-semibold">Need Help Getting Started?</h3>
						<div className="flex flex-wrap justify-center gap-4">
							<Button variant="outline" asChild>
								<Link href={routes.docs}>View Documentation</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link href={routes.contact}>Contact Support</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
