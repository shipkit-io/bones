import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { processStripeWebhook, verifyStripeWebhookSignature } from "@/lib/stripe";
import { PaymentService } from "@/server/services/payment-service";
import { userService } from "@/server/services/user-service";

/**
 * Stripe webhook handler
 * @see https://stripe.com/docs/webhooks
 * @see https://stripe.com/docs/webhooks/quickstart
 */

export async function POST(request: Request) {
	const startTime = Date.now();
	logger.info("Stripe webhook request received");

	try {
		// Check if Stripe is enabled
		if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
			logger.warn("Stripe webhook received but Stripe is not enabled");
			return new NextResponse("Stripe not enabled", { status: 400 });
		}

		// Get the signature from the headers
		const headersList = await headers();
		const signature = headersList.get("stripe-signature");

		if (!signature) {
			logger.warn("Missing Stripe signature in webhook request", {
				headers: Object.fromEntries(headersList.entries()),
			});
			return new NextResponse("Missing signature", { status: 401 });
		}

		// Get the raw body
		const body = await request.text();

		// Verify webhook signature
		const isValid = verifyStripeWebhookSignature(body, signature);
		if (!isValid) {
			logger.error("Invalid Stripe webhook signature");
			return new NextResponse("Invalid signature", { status: 401 });
		}

		// Parse the webhook event
		const event = JSON.parse(body) as Stripe.Event;

		logger.info("Processing Stripe webhook event", {
			eventType: event.type,
			eventId: event.id,
			livemode: event.livemode,
		});

		// Handle different webhook events
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object;
				logger.debug("Processing checkout session completed", { sessionId: session.id });

				if (session.payment_status === "paid" && session.customer) {
					try {
						const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
							apiVersion: (env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2023-10-16",
						});

						// Get customer ID - handle both string and object cases
						const customerId =
							typeof session.customer === "string" ? session.customer : session.customer.id;
						const customer = await stripe.customers.retrieve(customerId);

						if (customer && !customer.deleted) {
							// Find or create user by email
							const { user } = await userService.findOrCreateUserByEmail(customer.email!, {
								name: customer.name ?? undefined,
							});

							// Create payment record
							await PaymentService.createPayment({
								userId: user.id,
								orderId: session.id,
								status: "completed",
								amount: (session.amount_total ?? 0) / 100, // Convert from cents
								processor: "stripe",
								metadata: {
									sessionId: session.id,
									customerId: customer.id,
									customerEmail: customer.email,
									paymentStatus: session.payment_status,
									mode: session.mode,
								},
							});

							logger.info("Checkout session payment recorded", {
								sessionId: session.id,
								userId: user.id,
								customerEmail: customer.email,
								amount: session.amount_total,
							});
						}
					} catch (error) {
						logger.error("Error processing checkout session completed", {
							sessionId: session.id,
							error,
						});
					}
				}
				break;
			}

			case "payment_intent.succeeded": {
				const paymentIntent = event.data.object;
				logger.debug("Processing payment intent succeeded", {
					paymentIntentId: paymentIntent.id,
				});

				if (paymentIntent.customer) {
					try {
						const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
							apiVersion: (env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2023-10-16",
						});

						// Get customer ID - handle both string and object cases
						const customerId =
							typeof paymentIntent.customer === "string"
								? paymentIntent.customer
								: paymentIntent.customer.id;
						const customer = await stripe.customers.retrieve(customerId);

						if (customer && !customer.deleted) {
							// Find or create user by email
							const { user } = await userService.findOrCreateUserByEmail(customer.email!, {
								name: customer.name ?? undefined,
							});

							// Check if we already have a payment record for this payment intent
							const existingPayment = await PaymentService.getPaymentByOrderId(paymentIntent.id);

							if (!existingPayment) {
								// Create payment record
								await PaymentService.createPayment({
									userId: user.id,
									orderId: paymentIntent.id,
									status: "completed",
									amount: paymentIntent.amount / 100, // Convert from cents
									processor: "stripe",
									metadata: {
										paymentIntentId: paymentIntent.id,
										customerId: customer.id,
										customerEmail: customer.email,
										paymentMethod: paymentIntent.payment_method,
									},
								});

								logger.info("Payment intent payment recorded", {
									paymentIntentId: paymentIntent.id,
									userId: user.id,
									customerEmail: customer.email,
									amount: paymentIntent.amount,
								});
							} else {
								logger.debug("Payment intent already recorded", {
									paymentIntentId: paymentIntent.id,
									existingPaymentId: existingPayment.id,
								});
							}
						}
					} catch (error) {
						logger.error("Error processing payment intent succeeded", {
							paymentIntentId: paymentIntent.id,
							error,
						});
					}
				}
				break;
			}

			case "customer.subscription.created":
			case "customer.subscription.updated": {
				const subscription = event.data.object;
				logger.debug("Processing subscription event", {
					subscriptionId: subscription.id,
					status: subscription.status,
					eventType: event.type,
				});

				try {
					const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
						apiVersion: (env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2023-10-16",
					});

					// Get customer ID - handle both string and object cases
					const customerId =
						typeof subscription.customer === "string"
							? subscription.customer
							: subscription.customer.id;
					const customer = await stripe.customers.retrieve(customerId);

					if (customer && !customer.deleted) {
						// Find or create user by email
						const { user } = await userService.findOrCreateUserByEmail(customer.email!, {
							name: customer.name ?? undefined,
						});

						// For active subscriptions, ensure we have a payment record
						if (subscription.status === "active") {
							const existingPayment = await PaymentService.getPaymentByOrderId(subscription.id);

							if (!existingPayment) {
								// Get the subscription amount from the first item
								const amount = subscription.items.data[0]?.price.unit_amount ?? 0;

								const metadata: Record<string, any> = {
									subscriptionId: subscription.id,
									customerId: customer.id,
									customerEmail: customer.email,
									subscriptionStatus: subscription.status,
								};

								if (
									Object.hasOwn(subscription, "current_period_start") &&
									typeof (subscription as any).current_period_start === "number"
								) {
									metadata.currentPeriodStart = new Date(
										(subscription as any).current_period_start * 1000
									).toISOString();
								}

								if (
									Object.hasOwn(subscription, "current_period_end") &&
									typeof (subscription as any).current_period_end === "number"
								) {
									metadata.currentPeriodEnd = new Date(
										(subscription as any).current_period_end * 1000
									).toISOString();
								}

								await PaymentService.createPayment({
									userId: user.id,
									orderId: subscription.id,
									status: "completed",
									amount: amount / 100, // Convert from cents
									processor: "stripe",
									metadata,
								});

								logger.info("Subscription payment recorded", {
									subscriptionId: subscription.id,
									userId: user.id,
									customerEmail: customer.email,
									status: subscription.status,
									eventType: event.type,
								});
							}
						}
					}
				} catch (error) {
					logger.error("Error processing subscription event", {
						subscriptionId: subscription.id,
						eventType: event.type,
						error,
					});
				}
				break;
			}

			case "invoice.payment_succeeded": {
				const invoice = event.data.object;
				logger.debug("Processing invoice payment succeeded", { invoiceId: invoice.id });

				if (invoice.customer) {
					try {
						const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
							apiVersion: (env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2023-10-16",
						});

						// Get customer ID - handle both string and object cases
						const customerId =
							typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
						const customer = await stripe.customers.retrieve(customerId);

						if (customer && !customer.deleted) {
							// Find or create user by email
							const { user } = await userService.findOrCreateUserByEmail(customer.email!, {
								name: customer.name ?? undefined,
							});

							logger.info("Invoice payment succeeded", {
								invoiceId: invoice.id,
								userId: user.id,
								customerEmail: customer.email,
								amount: invoice.amount_paid,
							});
						}
					} catch (error) {
						logger.error("Error processing invoice payment succeeded", {
							invoiceId: invoice.id,
							error,
						});
					}
				}
				break;
			}

			default: {
				logger.info("Unhandled Stripe webhook event", {
					eventType: event.type,
					eventId: event.id,
				});
			}
		}

		logger.info("Stripe webhook processed successfully", {
			eventType: event.type,
			eventId: event.id,
			processingTime: Date.now() - startTime,
		});

		return new NextResponse("Webhook processed", { status: 200 });
	} catch (error) {
		logger.error("Stripe webhook processing error", {
			error,
			processingTime: Date.now() - startTime,
			...(error instanceof Error && {
				errorName: error.name,
				errorMessage: error.message,
				errorStack: error.stack,
			}),
		});
		return new NextResponse("Webhook error", { status: 500 });
	}
}

export async function GET(request: Request) {
	const headers = Object.fromEntries(request.headers.entries());
	logger.info("GET request received on Stripe webhook endpoint:", {
		url: request.url,
		method: request.method,
		headers,
	});
	return new NextResponse("Method not allowed", { status: 405 });
}
