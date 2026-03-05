// This file should NOT have "use server"; it's a server-side service.

import { auth } from "@/server/auth";
import { isAdmin } from "@/server/services/admin-service";

// Define the structure for each integration's status
export interface IntegrationStatus {
	// Export interface if needed elsewhere
	name: string;
	enabled: boolean; // Primarily based on feature flag or essential key
	configured: boolean; // Based on presence of necessary keys/secrets
	message: string;
	adminUrl?: string; // Optional URL for the integration's admin panel
}

// Define the structure for the categorized result
export type CategorizedIntegrationStatuses = Record<string, IntegrationStatus[]>;

/**
 * Service function to check the configuration status of various integrations,
 * grouped by category.
 */
export async function getIntegrationStatuses(): Promise<CategorizedIntegrationStatuses> {
	const session = await auth();

	// Authorization still makes sense here, as only admins should see this.
	if (!isAdmin({ email: session?.user?.email })) {
		return {
			Authorization: [
				{
					name: "Authorization",
					enabled: false,
					configured: false,
					message: "Unauthorized to check integration statuses.",
				},
			],
		};
	}

	const categorizedStatuses: CategorizedIntegrationStatuses = {
		"Content Management": [],
		Payments: [],
		"Artificial Intelligence": [],
		Storage: [],
		Analytics: [],
		"Developer Tools & API": [],
	};

	// Helper function to add status to a category
	const addStatus = (category: string, status: IntegrationStatus) => {
		if (!categorizedStatuses[category]) {
			categorizedStatuses[category] = [];
		}
		categorizedStatuses[category].push(status);
	};

	// === Content Management ===
	const dbUrl = !!process.env.DATABASE_URL;

	const payloadEnabled = process.env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED === "true";
	const payloadSecret = !!process.env.PAYLOAD_SECRET;
	const payloadConfigured = payloadEnabled && payloadSecret && dbUrl;
	addStatus("Content Management", {
		name: "Payload CMS",
		enabled: payloadEnabled,
		configured: payloadConfigured,
		message: !dbUrl
			? "Disabled (Database not configured)."
			: payloadEnabled
				? payloadConfigured
					? "Enabled and configured (Feature flag, Secret, DB URL set)."
					: "Enabled by feature flag, but missing PAYLOAD_SECRET."
				: "Disabled (NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED is not 'true').",
		adminUrl: payloadEnabled && payloadConfigured ? "/cms" : undefined,
	});

	const builderApiKey = !!process.env.NEXT_PUBLIC_BUILDER_API_KEY;
	const builderEnabledFlag = process.env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED === "true";
	addStatus("Content Management", {
		name: "Builder.io",
		enabled: builderEnabledFlag,
		configured: builderApiKey,
		message: builderEnabledFlag
			? builderApiKey
				? "Enabled and configured (API Key is set)."
				: "Enabled by feature flag, but NEXT_PUBLIC_BUILDER_API_KEY is missing."
			: "Disabled (NEXT_PUBLIC_FEATURE_BUILDER_ENABLED is not 'true').",
	});

	const mdxEnabled = process.env.NEXT_PUBLIC_FEATURE_MDX_ENABLED === "true";
	addStatus("Content Management", {
		name: "MDX Content",
		enabled: mdxEnabled,
		configured: mdxEnabled,
		message: mdxEnabled
			? "MDX processing is enabled."
			: "MDX processing is disabled (NEXT_PUBLIC_FEATURE_MDX_ENABLED is not 'true').",
	});

	// === Payments ===
	const stripeSecretKey = !!process.env.STRIPE_SECRET_KEY;
	const stripePublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
	const stripeWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
	const stripeConfigured = stripeSecretKey && stripePublishableKey;
	addStatus("Payments", {
		name: "Stripe",
		enabled: stripeConfigured,
		configured: stripeConfigured,
		message: stripeConfigured
			? `Configured (Secret & Publishable Keys set)${stripeWebhookSecret ? ", Webhook Secret set." : ", Webhook Secret recommended."}`
			: "Disabled (Missing STRIPE_SECRET_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).",
		adminUrl: stripeConfigured ? "https://dashboard.stripe.com/" : undefined,
	});

	const lemonApiKey = !!process.env.LEMONSQUEEZY_API_KEY;
	const lemonStoreId = !!process.env.LEMONSQUEEZY_STORE_ID;
	const lemonWebhookSecret = !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
	const lemonConfigured = lemonApiKey && lemonStoreId;
	addStatus("Payments", {
		name: "Lemon Squeezy",
		enabled: lemonConfigured,
		configured: lemonConfigured,
		message: lemonConfigured
			? `Configured (API Key & Store ID set)${lemonWebhookSecret ? ", Webhook Secret set." : ", Webhook Secret recommended."}`
			: "Disabled (Missing LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID).",
		adminUrl: lemonConfigured ? "https://app.lemonsqueezy.com/" : undefined,
	});

	const polarToken = !!process.env.POLAR_ACCESS_TOKEN;
	addStatus("Payments", {
		name: "Polar",
		enabled: polarToken,
		configured: polarToken,
		message: polarToken
			? "Configured (POLAR_ACCESS_TOKEN set)."
			: "Disabled (Missing POLAR_ACCESS_TOKEN).",
		adminUrl: "https://polar.sh/",
	});

	// === Artificial Intelligence ===
	const openaiKey = !!process.env.OPENAI_API_KEY;
	addStatus("Artificial Intelligence", {
		name: "OpenAI",
		enabled: openaiKey,
		configured: openaiKey,
		message: openaiKey ? "Configured (OPENAI_API_KEY set)." : "Disabled (Missing OPENAI_API_KEY).",
		adminUrl: "https://platform.openai.com/",
	});

	const anthropicKey = !!process.env.ANTHROPIC_API_KEY;
	addStatus("Artificial Intelligence", {
		name: "Anthropic",
		enabled: anthropicKey,
		configured: anthropicKey,
		message: anthropicKey
			? "Configured (ANTHROPIC_API_KEY set)."
			: "Disabled (Missing ANTHROPIC_API_KEY).",
		adminUrl: "https://console.anthropic.com/",
	});

	// === Storage ===
	addStatus("Storage", {
		name: "Database",
		enabled: dbUrl,
		configured: dbUrl,
		message: dbUrl
			? "Database connection configured (DATABASE_URL is set)."
			: "Database connection not configured (DATABASE_URL is missing).",
	});

	const s3Region = !!process.env.AWS_REGION;
	const s3AccessKey = !!process.env.AWS_ACCESS_KEY_ID;
	const s3SecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
	const s3Bucket = !!process.env.AWS_BUCKET_NAME;
	const s3Configured = s3Region && s3AccessKey && s3SecretKey && s3Bucket;
	addStatus("Storage", {
		name: "AWS S3",
		enabled: s3Configured,
		configured: s3Configured,
		message: s3Configured
			? "Configured (Region, Access Key, Secret Key, Bucket Name set)."
			: "Disabled (Missing one or more AWS S3 credentials/config).",
		adminUrl: "https://s3.console.aws.amazon.com/",
	});

	const blobToken = !!process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
	addStatus("Storage", {
		name: "Vercel Blob Storage",
		enabled: blobToken,
		configured: blobToken,
		message: blobToken
			? "Configured (VERCEL_BLOB_READ_WRITE_TOKEN set)."
			: "Disabled (Missing VERCEL_BLOB_READ_WRITE_TOKEN).",
		adminUrl: "https://vercel.com/dashboard",
	});

	// === Analytics ===
	const posthogKey = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
	addStatus("Analytics", {
		name: "PostHog",
		enabled: posthogKey,
		configured: posthogKey,
		message: posthogKey
			? "Configured (NEXT_PUBLIC_POSTHOG_KEY set)."
			: "Disabled (Missing NEXT_PUBLIC_POSTHOG_KEY).",
		adminUrl: "https://posthog.com/",
	});

	const umamiId = !!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
	addStatus("Analytics", {
		name: "Umami",
		enabled: umamiId,
		configured: umamiId,
		message: umamiId
			? "Configured (NEXT_PUBLIC_UMAMI_WEBSITE_ID set)."
			: "Disabled (Missing NEXT_PUBLIC_UMAMI_WEBSITE_ID).",
		adminUrl: "https://umami.is/",
	});

	const datafastId = !!process.env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID;
	addStatus("Analytics", {
		name: "DataFast",
		enabled: datafastId,
		configured: datafastId,
		message: datafastId
			? "Configured (NEXT_PUBLIC_DATAFAST_WEBSITE_ID set)."
			: "Disabled (Missing NEXT_PUBLIC_DATAFAST_WEBSITE_ID).",
		adminUrl: "https://datafa.st/",
	});

	// === Developer Tools & API ===
	const githubToken = !!process.env.GITHUB_ACCESS_TOKEN;
	const githubOwner = !!process.env.GITHUB_REPO_OWNER;
	const githubRepo = !!process.env.GITHUB_REPO_NAME;
	const githubApiConfigured = githubToken && githubOwner && githubRepo;
	addStatus("Developer Tools & API", {
		name: "GitHub API",
		enabled: githubApiConfigured,
		configured: githubApiConfigured,
		message: githubApiConfigured
			? "Configured (Token, Owner, Repo set)."
			: "Disabled (Missing GITHUB_ACCESS_TOKEN, GITHUB_REPO_OWNER, or GITHUB_REPO_NAME).",
		adminUrl: githubApiConfigured
			? `https://github.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}`
			: undefined,
	});

	const googleEmail = !!process.env.GOOGLE_CLIENT_EMAIL;
	const googleKey = !!process.env.GOOGLE_PRIVATE_KEY;
	const googleSvcConfigured = googleEmail && googleKey;
	addStatus("Developer Tools & API", {
		name: "Google Service Account",
		enabled: googleSvcConfigured,
		configured: googleSvcConfigured,
		message: googleSvcConfigured
			? "Configured (Client Email & Private Key set)."
			: "Disabled (Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY).",
		adminUrl: "https://console.cloud.google.com/",
	});

	const redisUrl = !!process.env.UPSTASH_REDIS_REST_URL;
	const redisToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
	const redisConfigured = redisUrl && redisToken;
	addStatus("Developer Tools & API", {
		name: "Redis (Upstash)",
		enabled: redisConfigured,
		configured: redisConfigured,
		message: redisConfigured
			? "Configured (URL & Token set)."
			: "Disabled (Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN).",
		adminUrl: "https://console.upstash.com/",
	});

	const vercelToken = !!process.env.VERCEL_ACCESS_TOKEN;
	addStatus("Developer Tools & API", {
		name: "Vercel API",
		enabled: vercelToken,
		configured: vercelToken,
		message: vercelToken
			? "Configured (VERCEL_ACCESS_TOKEN set)."
			: "Disabled (Missing VERCEL_ACCESS_TOKEN).",
		adminUrl: "https://vercel.com/dashboard",
	});

	return categorizedStatuses;
}
