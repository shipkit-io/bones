"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { routes } from "@/config/routes";

type SubscriptionProvider = "lemonsqueezy" | "polar";

// API helper for checking subscription status
async function checkSubscriptionStatus(
	provider?: SubscriptionProvider
): Promise<{ success: boolean; hasSubscription: boolean; message?: string }> {
	try {
		const url = new URL(routes.api.payments.checkSubscription, window.location.origin);
		if (provider) {
			url.searchParams.set("provider", provider);
		}
		const response = await fetch(url.toString());
		if (!response.ok) {
			return { success: false, hasSubscription: false, message: "Failed to check subscription" };
		}
		return response.json();
	} catch (error) {
		return { success: false, hasSubscription: false, message: "Failed to check subscription" };
	}
}

// Simple cache to prevent repeated API calls
const subscriptionCache = new Map<string, { data: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to check if the current user has an active subscription
 */
export function useSubscription(provider?: SubscriptionProvider) {
	const { data: session, status } = useSession();
	const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Memoize the check function to prevent unnecessary re-renders
	const checkSubscription = useCallback(async () => {
		if (status === "loading") return;

		if (!session?.user?.id) {
			setHasActiveSubscription(false);
			setIsLoading(false);
			return;
		}

		// Check cache first
		const cacheKey = `${session.user.id}-${provider || "all"}`;
		const cached = subscriptionCache.get(cacheKey);
		const now = Date.now();

		if (cached && now - cached.timestamp < CACHE_DURATION) {
			setHasActiveSubscription(cached.data);
			setIsLoading(false);
			return;
		}

		try {
			// Only log subscription checks in development or when debugging
			if (process.env.NODE_ENV === "development") {
				console.log(
					`Checking subscription for user ${session.user.email || session.user.id} with provider: ${provider || "all"}`
				);
			}
			const result = await checkSubscriptionStatus(provider);

			// Cache the result
			subscriptionCache.set(cacheKey, {
				data: result.hasSubscription,
				timestamp: now,
			});

			setHasActiveSubscription(result.hasSubscription);
			setError(null);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error("Error checking subscription:", errorMessage);
			setHasActiveSubscription(false);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [session?.user?.id, status, provider]); // Only depend on stable values

	useEffect(() => {
		// Only run if we have a stable user ID and status is not loading
		if (status !== "loading" && session?.user?.id) {
			checkSubscription();
		} else if (status === "unauthenticated") {
			// Clear state when user is not authenticated
			setHasActiveSubscription(false);
			setIsLoading(false);
			setError(null);
		}
	}, [session?.user?.id, status, provider, checkSubscription]);

	return {
		hasActiveSubscription,
		isLoading,
		error,
	};
}
