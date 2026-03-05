import type Stripe from "stripe";

/*
 * Stripe payment processor type definitions
 *
 * @see https://stripe.com/docs/api
 * @see https://github.com/stripe/stripe-node
 */

/**
 * Stripe payment data interface for internal use
 */
export interface StripePaymentData {
	id: string;
	orderId: string;
	userEmail: string;
	userName: string | null;
	amount: number;
	status: "paid" | "refunded" | "pending" | "failed";
	productName: string;
	purchaseDate: Date;
	discountCode: string | null;
	isSubscription: boolean;
	subscriptionId?: string;
	customerId?: string;
	priceId?: string;
	metadata?: Record<string, string>;
}

/**
 * Stripe order interface for consistency with other providers
 */
export interface StripeOrder {
	id: string;
	orderId: string;
	userEmail: string;
	userName: string | null;
	amount: number;
	status: "paid" | "refunded" | "pending" | "failed";
	productName: string;
	purchaseDate: Date;
	discountCode: string | null;
	attributes: Record<string, any>;
	isSubscription: boolean;
	subscriptionId?: string;
	customerId?: string;
	priceId?: string;
}

/**
 * Stripe checkout session data
 */
export interface StripeCheckoutSessionData {
	sessionId: string;
	customerId?: string;
	customerEmail?: string;
	amount: number;
	currency: string;
	status: string;
	paymentStatus: string;
	metadata?: Record<string, string>;
	lineItems?: Stripe.LineItem[];
}

/**
 * Stripe webhook event types we handle
 */
export type StripeWebhookEventType =
	| "checkout.session.completed"
	| "payment_intent.succeeded"
	| "payment_intent.payment_failed"
	| "invoice.payment_succeeded"
	| "invoice.payment_failed"
	| "customer.subscription.created"
	| "customer.subscription.updated"
	| "customer.subscription.deleted"
	| "customer.subscription.trial_will_end";

/**
 * Stripe webhook event interface
 */
export interface StripeWebhookEvent {
	id: string;
	type: StripeWebhookEventType;
	data: {
		object: any;
	};
	created: number;
	livemode: boolean;
	pending_webhooks: number;
	request: {
		id: string | null;
		idempotency_key: string | null;
	};
}

/**
 * Stripe product configuration for checkout
 */
export interface StripeProductConfig {
	priceId: string;
	productId?: string;
	name: string;
	description?: string;
	amount: number;
	currency: string;
	isSubscription: boolean;
	interval?: "month" | "year" | "week" | "day";
	intervalCount?: number;
}

/**
 * Stripe checkout options
 */
export interface StripeCheckoutOptions {
	priceId: string;
	successUrl: string;
	cancelUrl: string;
	customerId?: string;
	customerEmail?: string;
	metadata?: Record<string, string>;
	allowPromotionCodes?: boolean;
	mode?: "payment" | "subscription" | "setup";
	quantity?: number;
}

/**
 * Stripe customer interface
 */
export interface StripeCustomer {
	id: string;
	email: string;
	name?: string;
	metadata?: Record<string, string>;
	subscriptions?: Stripe.Subscription[];
	defaultPaymentMethod?: string;
}

/**
 * Stripe subscription interface
 */
export interface StripeSubscription {
	id: string;
	customerId: string;
	status: Stripe.Subscription.Status;
	priceId: string;
	productId: string;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
	trialStart?: Date;
	trialEnd?: Date;
	metadata?: Record<string, string>;
}

/**
 * Stripe error interface
 */
export interface StripeError {
	type: string;
	code?: string;
	message: string;
	param?: string;
	decline_code?: string;
	charge?: string;
	payment_intent?: string;
	payment_method?: string;
	setup_intent?: string;
	source?: string;
}
