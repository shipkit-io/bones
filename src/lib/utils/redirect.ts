import { redirect as nextRedirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Route } from "next";
import { BASE_URL } from "../../config/base-url";
import { SEARCH_PARAM_KEYS } from "../../config/search-param-keys";
import { logger } from "../logger";

interface RedirectOptions {
	code?: string;
	nextUrl?: string;
}

export function createRedirectUrl(pathname: string, options?: RedirectOptions): string {
	const url = new URL(pathname, BASE_URL);
	if (options?.code) {
		url.searchParams.set(SEARCH_PARAM_KEYS.statusCode, options.code);
	}
	if (options?.nextUrl) {
		url.searchParams.set(SEARCH_PARAM_KEYS.nextUrl, options.nextUrl);
	}
	return url.pathname + url.search;
}

export function redirect(pathname: string, options?: RedirectOptions) {
	const url = createRedirectUrl(pathname, options);
	return nextRedirect(url);
}

export function routeRedirect(
	destination: string,
	options?: string | { code?: string; nextUrl?: string; request?: Request }
) {
	if (!options) {
		return NextResponse.redirect(destination);
	}

	let url: URL;

	if (typeof options === "string") {
		url = new URL(destination, BASE_URL);
		url.searchParams.set(SEARCH_PARAM_KEYS.statusCode, options);
	} else {
		const baseUrl = options.request?.url || BASE_URL;
		url = new URL(destination, baseUrl);

		if (options?.nextUrl) {
			url.searchParams.set(SEARCH_PARAM_KEYS.nextUrl, options.nextUrl);
		}

		if (options?.code) {
			url.searchParams.set(SEARCH_PARAM_KEYS.statusCode, options.code);
		}
	}

	logger.info(`routeRedirect: Redirecting to ${url}`);
	return NextResponse.redirect(url);
}

export interface Redirect {
	source: Route;
	destination: Route;
	permanent: boolean;
}

export const createRedirects = (
	sources: Route[],
	destination: Route,
	permanent = false
): Redirect[] => {
	if (!sources.length) return [];

	return sources
		.filter((source) => source !== destination)
		.map((source) => ({ source, destination, permanent }));
};
