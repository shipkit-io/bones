import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { PaymentService } from "@/server/services/payment-service";

/**
 * GET /api/payments/check-purchase?productId=xxx&provider=polar
 *
 * Check if the current user has purchased a specific product.
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ success: false, purchased: false, error: "Authentication required" },
				{ status: 401 },
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const productId = searchParams.get("productId");
		const variantId = searchParams.get("variantId");
		const provider = searchParams.get("provider") as
			| "lemonsqueezy"
			| "polar"
			| undefined;

		if (!productId && !variantId) {
			return NextResponse.json(
				{
					success: false,
					purchased: false,
					error: "productId or variantId is required",
				},
				{ status: 400 },
			);
		}

		let purchased: boolean;

		if (variantId) {
			purchased = await PaymentService.hasUserPurchasedVariant({
				userId: session.user.id,
				variantId,
				provider,
			});
		} else {
			purchased = await PaymentService.hasUserPurchasedProduct({
				userId: session.user.id,
				productId: productId as string,
				provider,
			});
		}

		return NextResponse.json({ success: true, purchased });
	} catch (error) {
		console.error("Failed to check purchase status:", error);
		return NextResponse.json(
			{
				success: false,
				purchased: false,
				error: "Failed to check purchase status",
			},
			{ status: 500 },
		);
	}
}
