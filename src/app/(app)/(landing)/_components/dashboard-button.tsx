"use client";

import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

import { buttonVariants } from "@/components/ui/button";

import { Link } from "@/components/primitives/link";
import { getOrdersByEmail } from "@/lib/lemonsqueezy";
import { cn } from "@/lib/utils";
import { type Order } from "@lemonsqueezy/lemonsqueezy.js";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const DashboardButton = () => {
	const { data: session } = useSession();
	const [orders, setOrders] = useState<Order[]>([]);

	useEffect(() => {
		if (!session?.user?.email) return;
		void getOrdersByEmail(session.user.email).then(setOrders);
	}, [session]);

	if (!session) {
		return (
			<Link
				href={routes.auth.signIn}
				className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
			>
				Sign In
			</Link>
		);
	}

	if (orders.length === 0) {
		return (
			<Link
				href={routes.launch}
				className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
			>
				Get {siteConfig.name}
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
