"use client";

import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";

export const BuyButton = () => {
  const { data: session } = useSession();

  // Construct the checkout URL with user's email as custom_data
  const checkoutUrl = new URL(routes.external.buy);
  if (session?.user?.email) {
    checkoutUrl.searchParams.set(
      "checkout[custom][user_email]",
      session.user.email
    );
    // Also pass user ID for additional verification
    if (session.user.id) {
      checkoutUrl.searchParams.set(
        "checkout[custom][user_id]",
        session.user.id
      );
    }
    // Pre-fill the email field
    checkoutUrl.searchParams.set("checkout[email]", session.user.email);
  }

  return (
    <Link
      href={checkoutUrl.toString()}
      className={cn(buttonVariants({ variant: "default" }))}
    >
      Get {siteConfig.name}
    </Link>
  );
};
