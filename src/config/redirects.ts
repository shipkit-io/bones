import type { Route } from "next";
import { routes } from "./routes";

/**
 * Redirect type used by Next.js config.
 * Duplicated here to avoid importing from @/lib/utils/redirect which
 * pulls in next/navigation — unavailable during config transpilation.
 */
export interface Redirect {
	source: Route;
	destination: Route;
	permanent: boolean;
}

const createRedirects = (sources: Route[], destination: Route, permanent = false): Redirect[] => {
	if (!sources.length) return [];
	return sources
		.filter((source) => source !== destination)
		.map((source) => ({ source, destination, permanent }));
};

/**
 * Next.js redirect configuration.
 * Imported by next.config.ts — keep route aliases centralized here.
 */
/* eslint-disable-next-line @typescript-eslint/require-await */
export const redirects = async (): Promise<Redirect[]> => {
	return [
		...createRedirects(["/doc", "/docs", "/documentation"], routes.docs, true),
		...createRedirects(
			["/account", "/accounts", "/settings/accounts"],
			routes.settings.account,
			true
		),
		...createRedirects(["/join", "/signup", "/sign-up"], routes.auth.signUp, true),
		...createRedirects(["/login", "/log-in", "/signin", "/sign-in"], routes.auth.signIn),
		...createRedirects(["/logout", "/log-out", "/signout", "/sign-out"], routes.auth.signOut),
	];
};
