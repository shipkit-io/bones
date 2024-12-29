import { Link } from "@/components/primitives/link";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { getPaymentStatus, getPaymentStatusByEmail } from "@/lib/lemonsqueezy";

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
			? await getPaymentStatus(userId)
			: await getPaymentStatusByEmail(email!);

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
