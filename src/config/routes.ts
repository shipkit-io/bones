import type { Route } from "next";
import { siteConfig } from "./site-config";
type ParamValue = string | number | null;
export type RouteParams = Record<string, ParamValue>;

export interface RouteObject {
	path: Route;
	params?: RouteParams;
}

export const createRoute = (path: Route, params: RouteParams = {}): RouteObject => ({
	path,
	params,
});

// Flattened routes structure for better type safety and easier access
export const routes = {
	// Public routes
	home: "/",
	docs: "/docs",
	blog: "/blog",
	support: `mailto:${siteConfig.email.support}`,

	// Legal routes
	terms: "/terms-of-service",
	privacy: "/privacy-policy",

	// Marketing routes
	faq: "/faq",
	features: "/features",
	pricing: "/pricing",
	launch: "/launch",

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
		download: "/api/download",
		apiKeys: "/api/api-keys",
		apiKey: createRoute("/api/api-keys/:key", { key: null }),
		live: "/api/live-logs",
		sse: "/api/sse-logs",
		sendTestLog: "/api/send-test-log",
		activityStream: "/api/activity/stream",
		logger: "/v1",
		githubConnect: "/api/github/connect",
		githubDisconnect: "/api/github/disconnect",
	},

	// Worker routes
	workers: {
		logger: "/workers/workers/logger-worker.js",
	},
	// Demo routes
	demo: {
		network: "/network",
		trpc: "/trpc",
	},

	// External links
	external: {
		shipkit: `https://shipkit.io`,
		bones: `https://bones.sh`,
		log: `https://log.bones.sh`,
		ui: `https://ui.bones.sh`,
		buy: siteConfig.store.format.buyUrl("shipkit"),
		discord: "https://discord.gg/XxKrKNvEje",
		twitter: siteConfig.links.twitter,
		twitter_follow: siteConfig.links.twitter_follow,
		x: siteConfig.links.x,
		x_follow: siteConfig.links.x_follow,
		website: siteConfig.creator.url,
		docs: "https://shipkit.io/docs",
		email: `mailto:${siteConfig.creator.email}`,
		github: siteConfig.repo.url,
		vercelDeployBones:
			`https://vercel.com/new/clone?repository-url=https://github.com/${siteConfig.branding.githubOrg}/${siteConfig.branding.githubRepo}&project-name=${siteConfig.branding.vercelProjectName}&repository-name=${siteConfig.branding.vercelProjectName}&redirect-url=https://${siteConfig.branding.domain}/connect/vercel/deploy&developer-id=oac_KkY2TcPxIWTDtL46WGqwZ4BF&production-deploy-hook=${siteConfig.branding.projectName}%20Deploy&demo-title=${siteConfig.branding.projectName}%20Preview&demo-description=The%20official%20${siteConfig.branding.projectName}%20Preview.%20A%20full%20featured%20demo%20with%20dashboards,%20AI%20tools,%20and%20integrations%20with%20Docs,%20Payload,%20and%20Builder.io&demo-url=https://${siteConfig.branding.domain}/demo&demo-image=//assets.vercel.com/image/upload/contentful/image/e5382hct74si/4JmubmYDJnFtstwHbaZPev/0c3576832aae5b1a4d98c8c9f98863c3/Vercel_Home_OG.png`,
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
		...createRedirects(["/login", "/log-in", "/signin", "/sign-in"], routes.auth.signIn),
		...createRedirects(["/logout", "/log-out", "/signout", "/sign-out"], routes.auth.signOut),
	];
};

export const createRedirects = (
	sources: Route[],
	destination: Route,
	permanent = false
): Redirect[] => {
	if (!sources.length) return [];

	return sources
		.map((source) => {
			if (source === destination) return null;
			return { source, destination, permanent };
		})
		.filter((redirect): redirect is Redirect => redirect !== null);
};
