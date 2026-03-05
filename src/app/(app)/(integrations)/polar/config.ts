import type { CheckoutConfig } from "@polar-sh/nextjs";
import { BASE_URL } from "@/config/base-url";

export const polarConfig: CheckoutConfig = {
	accessToken: process.env.POLAR_ACCESS_TOKEN || "",
	successUrl: `${BASE_URL}/checkout/success?checkoutId={CHECKOUT_ID}&customer_session_token={CUSTOMER_SESSION_TOKEN}`,
	server: "sandbox",
};
