"use client";
import { default as NextLink, type LinkProps as NextLinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { Link as TransitionsLink } from "next-view-transitions";
import type React from "react";
import { useMemo } from "react";
import type { ButtonProps } from "@/components/ui/button";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { siteConfig } from "@/config/site-config";

interface CustomLinkProps {
	variant?: "default" | ButtonProps["variant"];
	withRedirect?: boolean;
	withTransition?: boolean;
}

type LinkProps = NextLinkProps &
	CustomLinkProps & { children: React.ReactNode } & Omit<
		React.AnchorHTMLAttributes<HTMLAnchorElement>,
		keyof NextLinkProps
	>;

export const Link = ({
	children,
	variant = "default",
	withRedirect = false,
	withTransition = siteConfig?.behavior?.pageTransitions,
	...props
}: LinkProps) => {
	const pathname = usePathname();

	const href = useMemo(() => {
		let newHref = typeof props.href === "string" ? props.href : (props.href.href ?? "");
		if (withRedirect) {
			const redirectTo = pathname;
			if (redirectTo && typeof window !== "undefined") {
				const nextUrl = new URL(redirectTo, window.location.origin);
				const params = new URLSearchParams();
				params.set(SEARCH_PARAM_KEYS.nextUrl, String(nextUrl));
				newHref = `${newHref}?${String(params)}`;
			}
		}
		return newHref;
	}, [props.href, withRedirect, pathname]);

	const LinkComponent = withTransition ? TransitionsLink : NextLink;

	return (
		<LinkComponent {...props} href={href}>
			{children}
		</LinkComponent>
	);
};
