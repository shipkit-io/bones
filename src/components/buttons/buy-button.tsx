import { Link } from "@/components/primitives/link";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import React from "react";

export const BuyButton = () => {
	return <Link
		href={routes.external.buy}
		className={cn(buttonVariants({ variant: "default" }))}
	>
		Get Shipkit
	</Link>
};
