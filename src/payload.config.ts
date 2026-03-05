// ! Don't use @/env here, it will break the build

import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { payloadCloudPlugin } from "@payloadcms/payload-cloud";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
// storage-adapter-import-placeholder
import { s3Storage } from "@payloadcms/storage-s3";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig, type Payload } from "payload";
import sharp from "sharp";

import { RESEND_FROM_EMAIL } from "@/config/constants";
import { buildTimeFeatures } from "@/config/features-config";
import { siteConfig } from "./config/site-config";
// Import components using path strings for Payload 3.0
// We'll use component paths instead of direct imports
import { FAQs } from "./lib/payload/collections/FAQs";
import { Features } from "./lib/payload/collections/Features";
import { Media } from "./lib/payload/collections/Media";
import { Pages } from "./lib/payload/collections/Pages";
import { RBAC } from "./lib/payload/collections/RBAC";
import { Testimonials } from "./lib/payload/collections/Testimonials";
import { Users } from "./lib/payload/collections/Users";
import { VercelDeployments } from "./lib/payload/collections/VercelDeployments";
// Import globals
import { Settings } from "./lib/payload/globals/Settings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Retrieve payload-specific config
const { adminTitleSuffix, adminIconPath, adminLogoPath, dbSchemaName, emailFromName } =
	siteConfig.payload;

const isPayloadEnabled = buildTimeFeatures.PAYLOAD_ENABLED;

const config = {
	secret: process.env.PAYLOAD_SECRET ?? "supersecret",
	routes: {
		admin: "/cms",
		api: "/cms-api",
	},
	admin: {
		// Conditionally load user authentication
		...(isPayloadEnabled ? { user: Users.slug } : {}),
		importMap: {
			baseDir: path.resolve(dirname),
		},
		// Use config values for branding
		meta: {
			titleSuffix: adminTitleSuffix,
			icons: [
				{
					rel: "icon",
					type: "image/x-icon",
					url: siteConfig.manifest.icons.favicon, // Use manifest favicon
				},
			],
			openGraph: {
				images: [
					{
						url: siteConfig.ogImage,
					},
				],
				siteName: siteConfig.title + adminTitleSuffix,
			},
			favicon: "/assets/favicon.ico",
			ogImage: siteConfig.ogImage,
		},
		components: {
			graphics: {
				Logo: adminLogoPath,
				Icon: adminIconPath,
			},
		},
	},
	collections: [Users, Pages, Media, FAQs, Features, Testimonials, RBAC, VercelDeployments],
	globals: [Settings],
	editor: lexicalEditor({}),
	typescript: {
		outputFile: path.resolve(dirname, "payload-types.ts"),
	},
	// ! Database
	// This allows us to use the same database for Payload and the application, payload will use a different schema.
	db: postgresAdapter({
		schemaName: dbSchemaName,
		pool: {
			connectionString: process.env.DATABASE_URL,
		},
		beforeSchemaInit: [
			({ schema, adapter }: { schema: any; adapter: any }) => {
				/*
				 * Define relationships between Payload and application tables
				 * Only add relationships that are actually needed
				 *
				 * Key relationships:
				 * 1. Users - for authentication and user management
				 * 2. RBAC - for permissions and access control
				 * 3. Media - for asset management
				 * 4. Content - for content management
				 */
				return {
					...schema,
					tables: {
						...schema.tables,
						// Users relationship - core authentication and user management
						users: {
							...schema.tables.users,
							relationships: [
								{
									relationTo: "public.shipkit_user",
									type: "oneToOne",
									onDelete: "CASCADE", // Delete app user when Payload user is deleted
								},
							],
						},
						// RBAC relationship - permissions and access control
						rbac: {
							...schema.tables.rbac,
							relationships: [
								{
									relationTo: "public.shipkit_role",
									type: "oneToMany",
								},
								// Enhanced relationship to permissions
								{
									relationTo: "public.shipkit_permission",
									type: "oneToMany",
								},
							],
						},
						// Media relationship - for asset management
						media: {
							...schema.tables.media,
							relationships: [
								{
									relationTo: "public.shipkit_user_file",
									type: "oneToMany",
								},
							],
						},
						// Pages relationship - for content management
						pages: {
							...schema.tables.pages,
							relationships: [
								{
									relationTo: "public.shipkit_post",
									type: "oneToMany",
								},
							],
						},
					},
				};
			},
		],
		migrationDir: path.resolve(dirname, "migrations"),
	}),
	sharp,
	// Add onInit hook to seed data when Payload initializes
	async onInit(payload: Payload) {
		// console.info("⏭️  Payload CMS initialized");
		try {
			// Skip seeding if PAYLOAD_AUTO_SEED is explicitly set to "false"
			if (process.env.PAYLOAD_AUTO_SEED === "false") {
				// console.info("⏭️ Automatic Payload CMS seeding is disabled");
				return;
			}

			// If Payload is not enabled, skip seeding and return
			if (!isPayloadEnabled) {
				// console.info("⏭️ Payload CMS is disabled, skipping seeding");
				return;
			}

			// Check if we should seed by looking for a marker in the database
			// We'll use the RBAC collection as a marker since it's always seeded first
			const shouldSeed = await checkIfSeedingNeeded(payload);

			// If force seeding is enabled, override the check
			if (process.env.PAYLOAD_SEED_FORCE === "true") {
				// console.info("🔄 Force seeding is enabled, proceeding with seed");
			}

			// Only seed if needed or forced
			if (shouldSeed || process.env.PAYLOAD_SEED_FORCE === "true") {
				// console.info("🌱 Seeding Payload CMS with initial data...");

				// Import the seedAllDirect function from seed-utils
				// This avoids circular dependencies by not importing from files that import payload
				const { seedAllDirect } = await import("./lib/payload/seed-utils");
				await seedAllDirect(payload);

				// Mark seeding as completed by setting a flag in the database
				await markSeedingCompleted(payload);

				// console.info("✅ Seeding completed and flag set");
			}
		} catch (error) {
			// console.error("❌ Error in Payload CMS onInit hook:", error);
		}
	},
	plugins: [
		payloadCloudPlugin(),

		// Conditionally add storage adapters if enabled
		...(buildTimeFeatures.S3_ENABLED && isPayloadEnabled
			? [
				s3Storage({
					collections: {
						media: true,
					},
					bucket: process.env.AWS_BUCKET_NAME!,
					config: {
						credentials: {
							accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
							secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
						},
						region: process.env.AWS_REGION!,
					},
				}),
			]
			: []),

		...(buildTimeFeatures.VERCEL_BLOB_ENABLED && isPayloadEnabled
			? [
				vercelBlobStorage({
					collections: {
						media: true,
					},
					token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN!,
				}),
			]
			: []),
	],
	// If RESEND_API_KEY is set, use the resend adapter
	...(buildTimeFeatures.AUTH_RESEND_ENABLED
		? {
			email: resendAdapter({
				defaultFromAddress: RESEND_FROM_EMAIL,
				defaultFromName: emailFromName, // Use config value
				apiKey: process.env.RESEND_API_KEY ?? "",
			}),
		}
		: {}),
	telemetry: false,
};

export default buildConfig(config);

/**
 * Check if seeding is needed by looking for a marker in the database
 * We'll use the settings global as a marker for seed status
 */
async function checkIfSeedingNeeded(payload: Payload): Promise<boolean> {
	try {
		// Check if the settings global has the seedCompleted flag
		const settings = await payload.findGlobal({
			slug: "settings",
		});

		// If seedCompleted is true, no need to seed
		if (settings?.seedCompleted) {
			return false;
		}

		// No data exists or seedCompleted is false, seeding is needed
		return true;
	} catch (error) {
		// console.error("Error checking if seeding is needed:", error);
		// If there's an error, assume seeding is needed
		return true;
	}
}

/**
 * Mark seeding as completed by setting a flag in the database
 */
async function markSeedingCompleted(payload: Payload): Promise<void> {
	try {
		// Update the settings global to mark seeding as completed
		await payload.updateGlobal({
			slug: "settings",
			data: {
				seedCompleted: true,
				seedCompletedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		// console.error("Error marking seeding as completed:", error);
	}
}
