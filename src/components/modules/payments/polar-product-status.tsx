"use client";

import { AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/assets/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createPolarCheckoutUrl } from "@/server/actions/payments";

// Helper to check purchase status via API
async function checkUserPurchasedProduct(
	productId: string,
	provider?: "lemonsqueezy" | "polar"
): Promise<{ success: boolean; purchased: boolean; message?: string }> {
	const params = new URLSearchParams({ productId });
	if (provider) params.set("provider", provider);

	const response = await fetch(`/api/payments/check-purchase?${params}`);
	if (!response.ok) {
		return { success: false, purchased: false, message: "Failed to check purchase status" };
	}
	return response.json();
}

// Simple cache to prevent repeated API calls
const productStatusCache = new Map<string, { data: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface PolarProductStatusProps {
	productId: string;
	productName: string;
	productDescription?: string;
	productPrice?: string;
	redirectUrl?: string;
	checkoutUrl?: string;
	className?: string;
	buttonText?: string;
	buttonUrl?: string;
	loadingText?: string;
	successText?: string;
}

export function PolarProductStatus({
	productId,
	productName,
	productDescription,
	productPrice,
	redirectUrl,
	checkoutUrl,
	className,
	buttonText = "Purchase Now",
	buttonUrl = "",
	loadingText = "Checking purchase status...",
	successText = "Purchased",
}: PolarProductStatusProps) {
	const { data: session } = useSession();
	const [isPurchased, setIsPurchased] = useState<boolean | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Memoize the check function to prevent unnecessary re-renders
	const checkPurchaseStatus = useCallback(async () => {
		if (!session?.user?.id) {
			setIsLoading(false);
			return;
		}

		// Check cache first
		const cacheKey = `${session.user.id}-${productId}`;
		const cached = productStatusCache.get(cacheKey);
		const now = Date.now();

		if (cached && now - cached.timestamp < CACHE_DURATION) {
			setIsPurchased(cached.data);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			const result = await checkUserPurchasedProduct(productId, "polar");

			if (result.success) {
				// Cache the result
				productStatusCache.set(cacheKey, {
					data: result.purchased,
					timestamp: now,
				});

				setIsPurchased(result.purchased);
			} else {
				setError(result.message || "Failed to check purchase status");
			}
		} catch (err) {
			setError("An error occurred while checking purchase status");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	}, [session?.user?.id, productId]);

	// Check if user has purchased this product
	useEffect(() => {
		if (session?.user?.id) {
			checkPurchaseStatus();
		}
	}, [session?.user?.id, productId, checkPurchaseStatus]);

	const handlePurchase = async () => {
		if (!session?.user?.id) {
			toast.error("Please sign in to purchase this product");
			return;
		}

		setIsLoading(true);
		try {
			// If checkoutUrl is provided, redirect to it
			if (checkoutUrl) {
				window.location.href = checkoutUrl;
				return;
			}

			// Use the server action to generate a checkout URL
			const result = await createPolarCheckoutUrl(productId);

			if (result.success && result.url) {
				window.location.href = result.url;
			} else {
				toast.error(result.message || "Failed to create checkout URL");
			}
		} catch (error) {
			console.error("Error creating checkout:", error);
			toast.error("Failed to initiate checkout");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center space-x-2">
				<Icons.spinner className="h-4 w-4 animate-spin" />
				<span className="text-sm text-muted-foreground">{loadingText}</span>
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive" className="mt-2">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	if (isPurchased) {
		return (
			<div className="flex items-center space-x-2">
				<CheckCircle className="h-4 w-4 text-green-500" />
				<span className="text-sm font-medium">{successText}</span>
			</div>
		);
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{productName}</CardTitle>
				{productDescription && <CardDescription>{productDescription}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{productPrice && <p className="font-semibold">{productPrice}</p>}
					<p className="text-sm text-muted-foreground">You haven't purchased this product yet.</p>
				</div>
			</CardContent>
			<CardFooter>
				<Button
					size="sm"
					variant="outline"
					onClick={handlePurchase}
					disabled={isLoading || !session?.user}
				>
					{isLoading ? (
						<>
							<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
							Processing...
						</>
					) : (
						<>
							{buttonText}
							{buttonUrl && <ExternalLink className="ml-2 h-4 w-4" />}
						</>
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
