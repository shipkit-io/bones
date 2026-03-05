import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { PaymentService } from "@/server/services/payment-service";

/**
 * GET /api/payments/check-subscription?provider=polar|lemonsqueezy
 *
 * Check if the current user has an active subscription.
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ success: false, hasSubscription: false, error: "Authentication required" },
				{ status: 401 },
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const provider = searchParams.get("provider") as
			| "lemonsqueezy"
			| "polar"
			| undefined;

		const hasSubscription = await PaymentService.hasUserActiveSubscription({
			userId: session.user.id,
			provider: provider || undefined,
		});

		return NextResponse.json({ success: true, hasSubscription });
	} catch (error) {
		console.error("Failed to check subscription status:", error);
		return NextResponse.json(
			{
				success: false,
				hasSubscription: false,
				error: "Failed to check subscription status",
			},
			{ status: 500 },
		);
	}
}
