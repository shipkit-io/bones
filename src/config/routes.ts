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
	/**
	 * Blog route - only use when NEXT_PUBLIC_HAS_BLOG === "true"
	 * @see src/config/nextjs/with-blog.ts for blog detection logic
	 */
	blog: "/blog",
	contact: "/contact",

	// Legal routes
	terms: "/terms-of-service",
	privacy: "/privacy-policy",
	eula: "/eula",
	legal: "/legal",

	// Marketing routes
	faq: "/faq",
	features: "/features",
	pricing: "/pricing",
	launch: "/launch",

	// App routes
	download: "/download",
	tasks: "/tasks",

	checkoutSuccess: "/checkout/success",

	// CMS routes
	cms: {
		index: "/cms",
		signIn: "/cms/sign-in",
		api: "/cms-api",
	},

	// Auth routes
	auth: {
		signIn: "/sign-in",
		signUp: "/sign-up",
		signOut: "/sign-out",
		forgotPassword: "/forgot-password",
		resetPassword: "/reset-password",
		signInPage: "/api/auth/signin",
		signOutPage: "/api/auth/signout",
		error: "/error",
	},

	// App routes
	app: {
		dashboard: "/dashboard",
		deployments: "/deployments",
		apiKeys: "/api-keys",
		logs: "/logs",
		network: "/network",
		live: "/live",
		tools: "/tools",
		downloads: "/downloads",
		activity: "/activity",
		projects: "/projects",
		teams: "/teams",
	},

	// Admin routes
	admin: {
		index: "/admin",
		users: "/admin/users",
		github: "/admin/github",
		integrations: "/admin/integrations",
		feedback: "/admin/feedback",
		payments: "/admin/payments",
	},

	settings: {
		index: "/settings",
		account: "/settings/account",
		profile: "/settings/profile",
		appearance: "/settings/appearance",
		security: "/settings/security",
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
		docsSearch: "/api/docs/search",
		github: {
			checkInvitation: "/api/github/check-invitation",
			checkRepoAvailability: "/api/github/check-repo-availability",
		},
		teams: "/api/teams",
		projects: "/api/projects",
		deployments: "/api/deployments",
		payments: {
			checkPurchase: "/api/payments/check-purchase",
			checkSubscription: "/api/payments/check-subscription",
		},
	},

	// Integration routes
	githubConnect: "/connect/github",
	vercelDeploy: "/connect/vercel/deploy",
	vercelDeployWebhook: "/connect/vercel/deploy/webhook",

	// Example routes
	examples: {
		index: "/examples",
		mail: "/examples/mail",
		dashboard: "/examples/dashboard",
		cards: "/examples/cards",
		tasks: "/examples/tasks",
		playground: "/examples/playground",
		forms: "/examples/forms",
		formsAccount: "/examples/forms/account",
		formsAppearance: "/examples/forms/appearance",
		formsNotifications: "/examples/forms/notifications",
		formsDisplay: "/examples/forms/display",
		music: "/examples/music",
		authentication: "/examples/authentication",
		notifications: "/examples/forms/notifications",
		profile: "/examples/forms/profile",
	},

	// Pages Router demo routes
	pages: {
		index: "/pages",
		static: "/pages/static",
		dynamic: "/pages/dynamic",
		apiExample: "/pages/api-example",
		markdown: "/pages/markdown",
	},

	ai: {
		index: "/ai",
		codeCompletion: "/ai/code-completion",
		crossEncoder: "/ai/cross-encoder",
		spam: "/ai/spam",
		reportGen: "/ai/report-gen",
		moonshineWeb: "/ai/moonshine-web",
		zeroShotClassification: "/ai/zero-shot-classification",
		whisper: "/ai/whisper",
		wwjhd: "/ai/wwjhd",
		whisperTimestamped: "/ai/whisper-timestamped",
		webgpuNomicEmbed: "/ai/webgpu-nomic-embed",
		webgpuEmbeddingBenchmark: "/ai/webgpu-embedding-benchmark",
		webgpuClip: "/ai/webgpu-clip",
		videoObjectDetection: "/ai/video-object-detection",
		videoBackgroundRemoval: "/ai/video-background-removal",
		typeAhead: "/ai/type-ahead",
		textToSpeechWebgpu: "/ai/text-to-speech-webgpu",
		speecht5Web: "/ai/speecht5-web",
		smolvmWeb: "/ai/smolvm-web",
		smollmWeb: "/ai/smollm-web",
		semanticSearch: "/ai/semantic-search",
		semanticImageSearchWeb: "/ai/semantic-image-search-web",
		removeBackground: "/ai/remove-background",
		removeBackgroundWeb: "/ai/remove-background-web",
		phi35Webgpu: "/ai/phi-3.5-webgpu",
		musicgenWeb: "/ai/musicgen-web",
		llama32Webgpu: "/ai/llama-3.2-webgpu",
		llama32ReasoningWebgpu: "/ai/llama-3.2-reasoning-webgpu",
		janusWebgpu: "/ai/janus-webgpu",
		janusProWebgpu: "/ai/janus-pro-webgpu",
		isSpam: "/ai/is-spam",
		gemma22bJpnWebgpu: "/ai/gemma-2-2b-jpn-webgpu",
		florence2Web: "/ai/florence2-web",
		deepseekWeb: "/ai/deepseek-web",
	},

	// Worker routes
	workers: {
		logger: "/workers/workers/logger-worker.js",
	},

	// Demo routes
	demo: {
		// CMS Demo routes
		builderio: "/builder",
		payloadCms: "/payload",

		network: "/network",

		// TRPC example from T3.gg
		trpc: "/trpc",
	},

	// External links
	external: {
		shipkit: "https://shipkit.io",
		bones: "https://bones.sh",
		log: "https://log.bones.sh",
		ui: "https://ui.bones.sh",
		buy: "https://shipkit.lemonsqueezy.com/checkout/buy/20b5b59e-b4c4-43b0-9979-545f90c76f28",
		discord: "https://discord.gg/XxKrKNvEje",
		twitter: siteConfig.links.twitter,
		twitter_follow: siteConfig.links.twitter_follow,
		x: siteConfig.links.x,
		x_follow: siteConfig.links.x_follow,
		// Social profiles (mirrors siteConfig.social)
		github: siteConfig.social.github || siteConfig.repo.url,
		linkedin: siteConfig.social.linkedin || "",
		instagram: siteConfig.social.instagram || "",
		facebook: siteConfig.social.facebook || "",
		youtube: siteConfig.social.youtube || "",
		tiktok: siteConfig.social.tiktok || "",
		discordCommunity: siteConfig.social.discord || "https://discord.gg/XxKrKNvEje",
		dribbble: siteConfig.social.dribbble || "",
		threads: siteConfig.social.threads || "",
		website: siteConfig.creator.url,
		docs: "/docs",
		email: `mailto:${siteConfig.creator.email}`,
		vercelDeploy: ({
			repositoryUrl,
			projectName,
			repositoryName,
			env = ["ADMIN_EMAIL"],
			redirectUrl = `${siteConfig.url}/connect/vercel/deploy`,
			developerId = "oac_KkY2TcPxIWTDtL46WGqwZ4BF",
			productionDeployHook = `${siteConfig.title} Deploy`,
			demoTitle = `${siteConfig.title} Preview`,
			demoDescription = `The official ${siteConfig.title} Preview. A full featured demo with dashboards, AI tools, and integrations with Docs, Payload, and Builder.io`,
			demoUrl = `${siteConfig.url}/demo`,
			demoImage = "//assets.vercel.com/image/upload/contentful/image/e5382hct74si/4JmubmYDJnFtstwHbaZPev/0c3576832aae5b1a4d98c8c9f98863c3/Vercel_Home_OG.png",
		}: {
			repositoryUrl: string;
			projectName: string;
			repositoryName: string;
			env?: string[];
			redirectUrl?: string;
			developerId?: string;
			productionDeployHook?: string;
			demoTitle?: string;
			demoDescription?: string;
			demoUrl?: string;
			demoImage?: string;
		}) => {
			const url = new URL("https://vercel.com/new/clone");
			url.searchParams.set("repository-url", repositoryUrl);
			url.searchParams.set("project-name", projectName);
			url.searchParams.set("repository-name", repositoryName);
			url.searchParams.set("redirect-url", redirectUrl);
			url.searchParams.set("developer-id", developerId);
			url.searchParams.set("production-deploy-hook", productionDeployHook);
			url.searchParams.set("demo-title", demoTitle);
			url.searchParams.set("demo-description", demoDescription);
			url.searchParams.set("demo-url", demoUrl);
			url.searchParams.set("demo-image", demoImage);
			url.searchParams.set("env", env.join(","));
			url.searchParams.set(
				"envDescription",
				`Required environment variables for ${siteConfig.title}`
			);
			url.searchParams.set("envLink", `${siteConfig.url}/docs/env`);
			return url.toString();
		},
		// &integration-ids=oac_KkY2TcPxIWTDtL46WGqwZ4BF
		vercelImportShipkit:
			"https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2Flacymorrow%2Fshipkit&hasTrialAvailable=1&project-name=shipkit&framework=nextjs&buildCommand=bun%20run%20build&installCommand=bun%20install%20--frozen-lockfile&env=ADMIN_EMAIL&integration-ids=oac_KkY2TcPxIWTDtL46WGqwZ4BF&envDescription=Set%20administrator%20access%20for%20your%20deployment&envLink=https%3A%2F%2Fshipkit.io%2Fdocs%2Fenv&redirect-url=https://shipkit.io/connect/vercel/deploy&demo-title=Shipkit&demo-description=Shipkit.%20The%20complete%20site%20building%20toolkit%20with%20dashboards%2C%20AI%20tools%2C%20and%20integrations%20with%20Docs%2C%20Payload%2C%20and%20Builder.io&demo-url=https%3A%2F%2Fshipkit.io%2Fdemo&demo-image=//assets.vercel.com%2Fimage%2Fupload%2Fcontentful%2Fimage%2Fe5382hct74si%2F4JmubmYDJnFtstwHbaZPev%2F0c3576832aae5b1a4d98c8c9f98863c3%2FVercel_Home_OG.png&developer-id=oac_KkY2TcPxIWTDtL46WGqwZ4BF&production-deploy-hook=Shipkit%20Deploy",
		vercelDeployBones:
			"https://vercel.com/new/clone?repository-url=https://github.com/shipkit-io/bones&env=ADMIN_EMAIL&envDescription=Set%20administrator%20access%20for%20your%20deployment&envLink=https%3A%2F%2Fshipkit.io%2Fdocs%2Fenv&project-name=bones-app&repository-name=bones-app&redirect-url=https://shipkit.io/connect/vercel/deploy&developer-id=oac_KkY2TcPxIWTDtL46WGqwZ4BF&production-deploy-hook=Shipkit%20Deploy&demo-title=Shipkit%20Preview&demo-description=The%20official%20Shipkit%20Preview.%20A%20full%20featured%20demo%20with%20dashboards,%20AI%20tools,%20and%20integrations%20with%20Docs,%20Payload,%20and%20Builder.io&demo-url=https://shipkit.io/demo&demo-image=//assets.vercel.com/image/upload/contentful/image/e5382hct74si/4JmubmYDJnFtstwHbaZPev/0c3576832aae5b1a4d98c8c9f98863c3/Vercel_Home_OG.png",
	},
};
