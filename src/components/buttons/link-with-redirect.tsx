"use client";

/*
 * This component redirects back to the same page after a successful action.
 * It's used to redirect the user back to the page they were on after they sign in.
 */

import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";

export type LinkWithRedirectProps = LinkProps & {
  redirectTo?: string;
  children?: ReactNode;
  className?: string;
};

export const LinkWithRedirect = ({
  children,
  href,
  redirectTo,
  ...props
}: LinkWithRedirectProps) => {
  const pathname = usePathname();
  if (!redirectTo) {
    redirectTo = pathname;
  }

  const nextUrl = useMemo(() => {
    if (redirectTo && typeof window !== "undefined") {
      return new URL(redirectTo, window.location.origin);
    }
    return undefined;
  }, [redirectTo]);

  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_KEYS.nextUrl, String(nextUrl));

  return (
    <Link
      {...props}
      href={`${typeof href === "string" ? href : href.href}?${String(params)}`}
    >
      {children}
    </Link>
  );
};
