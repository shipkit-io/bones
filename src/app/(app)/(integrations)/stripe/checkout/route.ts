import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { auth } from "@/server/auth";

/**
 * Stripe checkout route
 * Creates a Stripe checkout session and redirects to Stripe's hosted checkout
 *
 * @see https://stripe.com/docs/checkout/quickstart
 */

export async function GET(request: NextRequest) {
	try {
		// Check if Stripe is enabled
		if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
			logger.warn("Stripe checkout requested but Stripe is not enabled");
			return new NextResponse("Stripe not enabled", { status: 400 });
		}

		// Get authentication session
		const session = await auth();
		if (!session?.user?.id || !session?.user?.email) {
			logger.warn("User not authenticated");
			return new NextResponse("User not authenticated", { status: 401 });
		}

		// Get checkout parameters from URL
		const { searchParams } = new URL(request.url);
		const priceId = searchParams.get("price_id");
		const mode = searchParams.get("mode") ?? "payment";
		const successUrl =
			searchParams.get("success_url") ?? `${process.env.NEXT_PUBLIC_URL}/checkout/success`;
		const cancelUrl = searchParams.get("cancel_url") ?? `${process.env.NEXT_PUBLIC_URL}/pricing`;

		if (!priceId) {
			logger.warn("Missing price_id parameter in Stripe checkout request");
			return new NextResponse("Missing price_id parameter", { status: 400 });
		}

		logger.info("Creating Stripe checkout session", {
			priceId,
			mode,
			userId: session?.user?.id,
			userEmail: session?.user?.email,
		});

		// Create checkout session
		const checkoutUrl = await createStripeCheckoutSession({
			priceId,
			mode: mode as "payment" | "subscription" | "setup",
			successUrl,
			cancelUrl,
			customerEmail: session?.user?.email,
			metadata: {
				userId: session?.user?.id ?? "",
				priceId,
			},
		});

		if (!checkoutUrl) {
			logger.error("Failed to create Stripe checkout session");
			return new NextResponse("Failed to create checkout session", { status: 500 });
		}

		logger.info("Stripe checkout session created successfully", {
			priceId,
			userId: session?.user?.id,
			redirectUrl: checkoutUrl,
		});

		// Redirect to Stripe checkout
		return NextResponse.redirect(checkoutUrl);
	} catch (error) {
		logger.error("Error creating Stripe checkout session", {
			error,
			...(error instanceof Error && {
				errorName: error.name,
				errorMessage: error.message,
				errorStack: error.stack,
			}),
		});

		return new NextResponse("Internal server error", { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		// Check if Stripe is enabled
		if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
			logger.warn("Stripe checkout requested but Stripe is not enabled");
			return new NextResponse("Stripe not enabled", { status: 400 });
		}

		// Get authentication session
		const session = await auth();
		if (!session?.user?.id || !session?.user?.email) {
			logger.warn("User not authenticated");
			return new NextResponse("User not authenticated", { status: 401 });
		}

		// Parse request body
		const body = await request.json();
		const { priceId, mode = "payment", successUrl, cancelUrl, metadata } = body;

		if (!priceId) {
			logger.warn("Missing priceId in Stripe checkout request body");
			return new NextResponse("Missing priceId", { status: 400 });
		}

		logger.info("Creating Stripe checkout session via POST", {
			priceId,
			mode,
			userId: session?.user?.id,
			userEmail: session?.user?.email,
		});

		// Create checkout session
		const checkoutUrl = await createStripeCheckoutSession({
			priceId,
			mode: mode as "payment" | "subscription" | "setup",
			successUrl: successUrl ?? `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
			cancelUrl: cancelUrl ?? `${process.env.NEXT_PUBLIC_URL}/pricing`,
			customerEmail: session?.user?.email,
			metadata: {
				userId: session?.user?.id ?? "",
				priceId,
				...metadata,
			},
		});

		if (!checkoutUrl) {
			logger.error("Failed to create Stripe checkout session");
			return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
		}

		logger.info("Stripe checkout session created successfully via POST", {
			priceId,
			userId: session?.user?.id,
			checkoutUrl,
		});

		// Return checkout URL as JSON
		return NextResponse.json({
			url: checkoutUrl,
			priceId,
			mode,
		});
	} catch (error) {
		logger.error("Error creating Stripe checkout session via POST", {
			error,
			...(error instanceof Error && {
				errorName: error.name,
				errorMessage: error.message,
				errorStack: error.stack,
			}),
		});

		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
