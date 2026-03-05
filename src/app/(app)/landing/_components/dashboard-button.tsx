import { Link } from "@/components/primitives/link";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { getOrdersByEmail } from "@/lib/lemonsqueezy";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";

export const DashboardButton = async () => {
	const session = await auth();

	if (!session?.user) {
		return (
			<Link
				href={routes.auth.signIn}
				className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
			>
				Sign In
			</Link>
		);
	}

	const orders = session.user.email ? await getOrdersByEmail(session.user.email) : [];

	if (orders.length === 0) {
		return (
			<Link
				href={routes.launch}
				className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
			>
				Get {siteConfig.title}
			</Link>
		);
	}

	return (
		<Link
			href={routes.app.dashboard}
			className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
		>
			Dashboard
		</Link>
	);
};
