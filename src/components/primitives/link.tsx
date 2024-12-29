/*
 * Link component
 * Allows for page transitions during navigation
 *
 * @see https://nextjs.org/docs/app/api-reference/components/link
 */

import { siteConfig } from "@/config/site";
import { Link as TransitionsLink } from "next-view-transitions";
import { default as NextLink } from "next/link";
import type React from "react";

export const Link = ({
	children,
	...props
}: React.ComponentProps<typeof NextLink>) => {
	if (siteConfig?.behavior?.pageTransitions) {
		return <TransitionsLink {...props}>{children}</TransitionsLink>;
	}

	return <NextLink {...props}>{children}</NextLink>;
};
