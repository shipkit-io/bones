import type { Route } from "next";
import { siteConfig } from "./site";
type ParamValue = string | number | null;
type RouteParams = Record<string, ParamValue>;

interface RouteObject {
	path: Route;
	params?: RouteParams;
}

export const createRoute = (
	path: Route,
	params: RouteParams = {},
): RouteObject => ({
	path,
	params,
});

// Flattened routes structure for better type safety and easier access
// Flattened routes structure for better type safety and easier access
export const routes = {
	// Public routes
	home: "/",
	docs: "/docs",
	blog: "/blog",
	support: "/support",

	// Legal routes
	terms: "/terms-of-service",
	privacy: "/privacy-policy",

	// Marketing routes
	faq: "/faq",
	features: "/features",
	pricing: "/pricing",
	launch: "/launch",
	getStarted: "/get-started",

	// App routes
	download: "/download",
	components: "/components",
	tasks: "/tasks",

	// Auth routes
	// Auth routes
	auth: {
		signIn: "/sign-in",
		signUp: "/sign-up",
		signOut: "/sign-out",
		forgotPassword: "/forgot-password",
		signInPage: "/api/auth/signin",
		signOutPage: "/api/auth/signout",
		signOutIn: "/sign-out-in",
		error: "/error",
	},

	// App routes
	app: {
		dashboard: "/dashboard",
		apiKeys: "/api-keys",
		logs: "/logs",
		network: "/network",
		live: "/live",
		settings: "/settings",
		tools: "/tools",
		downloads: "/downloads",
		admin: "/admin",
		activity: "/activity",
		projects: "/projects",
		teams: "/teams",
	},

	// Admin routes
	admin: {
		root: "/admin",
		activity: "/admin/activity",
		users: "/admin/users",
		cms: "/admin/cms",
		ai: "/admin/ai",
		feedback: "/admin/feedback",
		payments: "/admin/payments",
	},

	// Example routes
	examples: {
		root: "/examples",
		dashboard: "/examples/dashboard",
		forms: "/examples/forms",
		authentication: "/examples/authentication",
		notifications: "/examples/forms/notifications",
		profile: "/examples/forms/profile",
	},

	// API routes
	api: {
		apiKeys: "/api/api-keys",
		apiKey: createRoute("/api/api-keys/:key", { key: null }),
		live: "/api/live-logs",
		sse: "/api/sse-logs",
		sendTestLog: "/api/send-test-log",
		activityStream: "/api/activity/stream",
		logger: "/v1",
	},

	// Worker routes
	workers: {
		logger: "/workers/workers/logger-worker.js",
	},
	// Demo routes
	demo: {
		network: "/demo/network",
	},

	// External links
	external: {
		buy: siteConfig.store.format.buyUrl("muscles"),
		twitter: siteConfig.links.twitter,
		twitter_follow: siteConfig.links.twitter_follow,
		x: siteConfig.links.x,
		x_follow: siteConfig.links.x_follow,
		website: siteConfig.creator.url,
		docs: "/docs",
		email: `mailto:${siteConfig.creator.email}`,
		github: siteConfig.repo.url,
		vercel:
			'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flacymorrow%2Fshipkit&env=NEXT_PUBLIC_BUILDER_API_KEY&envDescription=Builder.io%20API&envLink=https%3A%2F%2Fwww.builder.io%2F&project-name=my-app&repository-name=my-app&redirect-url=https%3A%2F%2Fshipkit.io%2Fconnect%2Fvercel%2Fdeploy&developer-id=oac_KkY2TcPxIWTDtL46WGqwZ4BF&production-deploy-hook=Shipkit%20Deploy&demo-title=Shipkit%20Preview&demo-description=The%20official%20Shipkit%20Preview.%20A%20full%20featured%20demo%20with%20dashboards%2C%20AI%20tools%2C%20and%20integrations%20with%20Docs%2C%20Payload%2C%20and%20Builder.io&demo-url=https%3A%2F%2Fshipkit.io%2Fdemo&demo-image=https%3A%2F%2Fshipkit.io%2Fimages%2Fvercel%2Fdemo.png&stores=%5B%7B"type"%3A"postgres"%7D%2C%7B"type"%3A"kv"%7D%5D',
	},
};

interface Redirect {
	source: Route;
	destination: Route;
	permanent: boolean;
}

/* eslint-disable-next-line @typescript-eslint/require-await */
export const redirects = async (): Promise<Redirect[]> => {
	return [
		...createRedirects(["/docs", "/documentation"], routes.docs),
		...createRedirects(["/join", "/signup", "/sign-up"], routes.auth.signUp),
		...createRedirects(
			["/login", "/log-in", "/signin", "/sign-in"],
			routes.auth.signIn,
		),
		...createRedirects(
			["/logout", "/log-out", "/signout", "/sign-out"],
			routes.auth.signOut,
		),
	];
};

export const createRedirects = (
	sources: Route[],
	destination: Route,
	permanent = false,
): Redirect[] => {
	if (!sources.length) return [];

	return sources
		.map((source) => {
			if (source === destination) return null;
			return { source, destination, permanent };
		})
		.filter((redirect): redirect is Redirect => redirect !== null);
};
