"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

// Import server actions using the next dynamic import pattern
import { createLemonSqueezyPayment } from "@/server/actions/payments";

declare global {
	interface Window {
		createLemonSqueezy: () => void;
		LemonSqueezy?: {
			Setup: ({ eventHandler }: { eventHandler: (event: LemonSqueezyEvent) => void }) => void;
			Url: {
				Close: () => void;
				Open: (url: string) => void;
			};
		};
	}
}

interface LemonSqueezyEvent {
	event: string;
	data: {
		order: {
			meta: {
				test_mode: boolean;
			};
			data: {
				id: string;
				attributes: {
					store_id: number;
					customer_id: number;
					identifier: string;
					order_number: number;
					user_name: string | null;
					user_email: string | null;
					currency: string;
					status: string;
					total: number;
					first_order_item: {
						id: number;
						order_id: number;
						product_id: number;
						variant_id: number;
						product_name: string;
						variant_name: string;
						price: number;
						test_mode: boolean;
					};
					test_mode: boolean;
				};
			};
		};
		custom_data?: {
			user_id?: string;
			user_email?: string;
		};
	};
}

// Helper function to manage body scroll
const toggleBodyScroll = (disable: boolean) => {
	if (disable) {
		// Store the current scroll position
		const scrollY = window.scrollY;
		document.body.style.position = "fixed";
		document.body.style.width = "100%";
		document.body.style.top = `-${scrollY}px`;
	} else {
		// Restore the scroll position
		const scrollY = document.body.style.top;
		document.body.style.position = "";
		document.body.style.width = "";
		document.body.style.top = "";
		// window.scrollTo(0, Number.parseInt(scrollY || '0', 10) * -1); // THIS CAUSES A SCROLL BUG
	}
};

interface BuyButtonProps {
	className?: string;
	checkoutId?: string;
	storeId?: string;
}

export const BuyButton = ({ className, ...props }: BuyButtonProps) => {
	const checkoutId = props.checkoutId ?? "20b5b59e-b4c4-43b0-9979-545f90c76f28";
	const storeId = props.storeId ?? siteConfig.store.id;

	const { data: session } = useSession();
	const router = useRouter();
	const isScriptLoadedRef = useRef(false);

	// Stabilize session-dependent values
	const userId = session?.user?.id;
	const userEmail = session?.user?.email;

	// Memoize the event handler to prevent it from changing on every render
	const eventHandler = useCallback(
		async (event: LemonSqueezyEvent) => {
			if (!event?.event?.startsWith("Checkout")) {
				return;
			}

			logger.info("Lemon Squeezy event received", {
				checkoutId,
				event: event.event,
				orderId: event.data?.order?.data?.id,
				userId,
			});

			switch (event.event) {
				case "Checkout.Success": {
					const orderData = event.data.order.data;

					logger.info("Purchase successful", {
						checkoutId,
						orderId: orderData.id,
						userId,
						orderData: {
							identifier: orderData.attributes.identifier,
							status: orderData.attributes.status,
							total: orderData.attributes.total,
							productName: orderData.attributes.first_order_item.product_name,
						},
					});

					// Close the overlay
					window.LemonSqueezy?.Url.Close();
					// Re-enable scrolling
					toggleBodyScroll(false);

					try {
						logger.info("Creating payment record", {
							checkoutId,
							orderId: orderData.id,
							userId,
						});

						// Call server action to create payment record
						const result = await createLemonSqueezyPayment({
							orderId: orderData.attributes.identifier, // Use identifier as primary orderId
							orderIdentifier: orderData.attributes.identifier, // Keep for backward compatibility
							userId,
							userEmail: orderData.attributes.user_email || undefined,
							customData: event.data.custom_data,
							status: orderData.attributes.status,
							total: orderData.attributes.total,
							productName: orderData.attributes.first_order_item?.product_name || "Unknown Product",
						});

						logger.info("Payment record created successfully", {
							checkoutId,
							orderId: orderData.id,
							userId,
							result,
						});

						toast.success("Payment processed! Redirecting to dashboard...");
						router.push(routes.app.dashboard);
					} catch (error) {
						logger.error("Error creating payment record", {
							checkoutId,
							orderId: orderData.id,
							userId,
							error: error instanceof Error ? error.message : String(error),
							stack: error instanceof Error ? error.stack : undefined,
						});

						// Fallback to success page redirect if API fails
						const successUrl = new URL(routes.checkoutSuccess, window.location.origin);

						// Add order data to URL
						successUrl.searchParams.set("order_id", orderData.attributes.identifier);
						successUrl.searchParams.set("email", orderData.attributes.user_email || "");
						successUrl.searchParams.set("status", orderData.attributes.status);

						// Add custom data that was passed during checkout
						if (userId) {
							const customData = {
								user_id: userId,
								user_email: userEmail,
							};
							successUrl.searchParams.set("custom_data", JSON.stringify(customData));
						}

						toast.error(
							"There was an issue processing your payment. Redirecting to order confirmation..."
						);
						router.push(successUrl.toString());
					}
					break;
				}
				case "Checkout.Closed": {
					logger.info("Checkout closed", {
						checkoutId,
						userId,
					});
					break;
				}
				default: {
					logger.info("Unknown event", {
						checkoutId,
						event: event.event,
					});
				}
			}

			toggleBodyScroll(false); // Re-enable scrolling
		},
		[checkoutId, userId, userEmail, router]
	);

	useEffect(() => {
		// Prevent duplicate script loading
		if (isScriptLoadedRef.current) {
			return;
		}

		// Load Lemon.js script
		const script = document.createElement("script");
		script.src = "https://app.lemonsqueezy.com/js/lemon.js";
		script.defer = true;
		document.body.appendChild(script);

		script.onload = () => {
			// Initialize Lemon.js
			window.createLemonSqueezy?.();

			// Setup event handlers
			window?.LemonSqueezy?.Setup({
				eventHandler,
			});

			isScriptLoadedRef.current = true;
		};

		script.onerror = (error) => {
			logger.error("Error loading Lemon.js script", {
				checkoutId,
				error: String(error),
			});
		};

		return () => {
			logger.info("Cleaning up BuyButton", { checkoutId });
			// Only remove script if it was added by this component
			if (script.parentNode) {
				document.body.removeChild(script);
			}
			toggleBodyScroll(false); // Ensure scrolling is re-enabled on unmount
			isScriptLoadedRef.current = false;
		};
	}, [checkoutId, eventHandler]);

	const handleClick = () => {
		logger.info("Buy button clicked", {
			checkoutId,
			userId,
			userEmail,
		});

		// Use the configured checkout URL from site config
		// This ensures we're using the correct variant ID for checkout
		const checkoutUrl = new URL(`https://${storeId}.lemonsqueezy.com/checkout/buy/${checkoutId}`);

		// Add success page URL
		const successUrl = new URL(routes.checkoutSuccess, window.location.origin);
		checkoutUrl.searchParams.set("checkout[success_url]", successUrl.toString());

		if (userEmail) {
			// Add user data
			checkoutUrl.searchParams.set("checkout[custom][user_email]", userEmail);
			if (userId) {
				checkoutUrl.searchParams.set("checkout[custom][user_id]", userId);
			}
			// Pre-fill the email field
			checkoutUrl.searchParams.set("checkout[email]", userEmail);
		}

		logger.info("Opening checkout", {
			checkoutId,
			userId,
			checkoutUrl: checkoutUrl.toString(),
		});

		// Disable scrolling before opening the overlay
		toggleBodyScroll(true);
		// Open the checkout overlay with dark theme
		checkoutUrl.searchParams.set("dark", "1");
		window.LemonSqueezy?.Url.Open(checkoutUrl.toString());
	};

	return (
		<>
			<Button onClick={handleClick} variant="default" className={cn(className)}>
				Get {siteConfig.title}
			</Button>
		</>
	);
};
