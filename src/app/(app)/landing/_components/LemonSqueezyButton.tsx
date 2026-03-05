import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { PaymentService } from "@/server/services/payment-service";
import { useSession } from "next-auth/react";

interface LemonSqueezyButtonProps {
	userId?: string | null;
	email?: string | null;
}

const signInButton = (
	<Link className={buttonVariants()} href={routes.auth.signIn}>
		Login
	</Link>
);

export const LemonSqueezyButton = async ({
	userId,
	email,
}: LemonSqueezyButtonProps) => {
	if (!userId && !email) {
		return signInButton;
	}

	try {
		const hasPaid = userId
			? await PaymentService.getUserPaymentStatus(userId)
			: false;

		if (!hasPaid) {
			return (
				<Link className={buttonVariants()} href={routes.external.buy}>
					Buy Now
				</Link>
			);
		}

		return (
			<Link className={buttonVariants()} href={routes.app.dashboard}>
				Go to Dashboard
			</Link>
		);
	} catch (error) {
		console.error("Error fetching payment status:", error);
		return signInButton;
	}
};

export function LemonSqueezyCheckoutButton() {
	const { data: session } = useSession();

	const handleClick = async () => {
		if (!session?.user?.email) {
			console.error("No user email found");
			return;
		}

		try {
			const userId = session.user.id;
			const email = session.user.email;

			// Check if user has already paid
			const hasPaid = userId
				? await PaymentService.getUserPaymentStatus(userId)
				: false;

			if (hasPaid) {
				// console.log("User has already paid");
				// Redirect logic or UI update can go here
				// e.g., router.push("/dashboard");
				return;
			}

			// Create checkout URL
			const checkoutUrl = `https://shipkit.lemonsqueezy.com/checkout/buy/xxx?checkout[email]=${encodeURIComponent(
				email,
			)}&checkout[custom][user_id]=${encodeURIComponent(userId)}`;

			// Redirect to checkout
			window.location.href = checkoutUrl;
		} catch (error) {
			console.error("Error creating checkout:", error);
		}
	};

	return (
		<Button onClick={handleClick} size="lg">
			Buy Now
		</Button>
	);
}
