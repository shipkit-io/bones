import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

interface RedirectWithCodeOptions {
  code?: string;
  nextUrl?: string;
}

export const redirectWithCode = (
  url: string,
  options?: RedirectWithCodeOptions,
) => {
  const { code, nextUrl } = options ?? {};
  const redirectUrl = new URL(url, process.env.NEXTAUTH_URL);

  if (code) {
    redirectUrl.searchParams.set("code", code);
  }

  if (nextUrl) {
    redirectUrl.searchParams.set(SEARCH_PARAM_KEYS.nextUrl, nextUrl);
  }

  return redirect(redirectUrl.toString());
};

export const routeRedirectWithCode = (
  destination: string,
  options?: string | { code?: string; nextUrl?: string; request?: Request },
) => {
  if (!options) {
    return NextResponse.redirect(destination);
  }

  let url: URL;

  if (typeof options === "string") {
    url = new URL(destination);
    url.searchParams.set(SEARCH_PARAM_KEYS.statusCode, options);
  } else {
    url = new URL(destination, options.request?.url);

    if (options?.nextUrl) {
      url.searchParams.set(SEARCH_PARAM_KEYS.nextUrl, options.nextUrl);
    }

    if (options?.code) {
      url.searchParams.set(SEARCH_PARAM_KEYS.statusCode, options.code);
    }
  }

  logger.info(`serverRedirectWithCode: Redirecting to ${url}`);
  return NextResponse.redirect(url);
};
