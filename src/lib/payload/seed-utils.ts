import type { Payload } from "payload";
import type { Faq } from "@/payload-types";

// Define common resources and actions for RBAC
const resources = ["team", "project", "user", "api_key", "billing", "settings"] as const;
const actions = ["create", "read", "update", "delete", "manage"] as const;

type Resource = (typeof resources)[number];
type Action = (typeof actions)[number];

// Define default roles with their permissions
const defaultRoles = [
	{
		name: "Owner",
		description: "Full access to all resources",
		permissions: resources.map((resource) => ({
			resource,
			actions: ["manage"] as Action[],
		})),
	},
	{
		name: "Admin",
		description: "Administrative access with some restrictions",
		permissions: resources.map((resource) => ({
			resource,
			actions: ["create", "read", "update", "delete"] as Action[],
		})),
	},
	{
		name: "Member",
		description: "Standard team member access",
		permissions: [
			{
				resource: "team" as Resource,
				actions: ["read"] as Action[],
			},
			{
				resource: "project" as Resource,
				actions: ["read", "update"] as Action[],
			},
			{
				resource: "user" as Resource,
				actions: ["read"] as Action[],
			},
			{
				resource: "api_key" as Resource,
				actions: ["read", "create"] as Action[],
			},
			{
				resource: "settings" as Resource,
				actions: ["read"] as Action[],
			},
		],
	},
	{
		name: "Viewer",
		description: "Read-only access",
		permissions: resources.map((resource) => ({
			resource,
			actions: ["read"] as Action[],
		})),
	},
] as const;

// Helper function to create rich text content
export const createRichText = (text: string) => ({
	root: {
		type: "root" as const,
		children: [
			{
				type: "paragraph" as const,
				children: [
					{
						text,
						type: "text" as const,
					},
				],
				version: 1,
			},
		],
		direction: "ltr" as const,
		format: "left" as const,
		indent: 0,
		version: 1,
	},
});

// Function to seed RBAC
export const seedRBACDirect = async (payload: Payload) => {
	try {
		console.info("🔄 Clearing existing RBAC data...");
		// Clear existing RBAC data
		await payload.delete({
			collection: "rbac",
			where: {
				id: {
					exists: true,
				},
			},
		});

		console.info("🔄 Creating permissions...");
		// Create all possible permissions first
		const createdPermissions = await Promise.all(
			resources.flatMap((resource) =>
				actions.map(async (action) => {
					try {
						const permission = await payload.create({
							collection: "rbac",
							data: {
								name: `${action}_${resource}`,
								description: `Can ${action} ${resource.replace("_", " ")}`,
								type: "permission",
								resource,
								action,
							},
						});
						return permission;
					} catch (error) {
						console.error(`Error creating permission ${action}_${resource}:`, error);
						return null;
					}
				})
			)
		);

		const validPermissions = createdPermissions.filter(Boolean);
		console.info(`✅ Created ${validPermissions.length} permissions`);

		console.info("🔄 Creating roles...");
		// Create default roles with their permissions
		const createdRoles = await Promise.all(
			defaultRoles.map(async (roleData) => {
				try {
					// Find relevant permissions for this role
					const rolePermissions = validPermissions.filter((permission) => {
						const rolePerms = roleData.permissions.find((p) => p.resource === permission?.resource);
						return (
							rolePerms &&
							(rolePerms.actions.includes(permission?.action!) ||
								(rolePerms.actions.includes("manage" as Action) && permission?.action === "manage"))
						);
					});

					// Create the role with its permissions
					const role = await payload.create({
						collection: "rbac",
						data: {
							name: roleData.name,
							description: roleData.description,
							type: "role",
							permissions: rolePermissions.map((p) => p?.id ?? 0), // Ensure id is always a number
						},
					});
					return role;
				} catch (error) {
					console.error(`Error creating role ${roleData.name}:`, error);
					return null;
				}
			})
		);

		const validRoles = createdRoles.filter(Boolean);
		console.info(`✅ Created ${validRoles.length} roles`);
		return { permissions: validPermissions, roles: validRoles };
	} catch (error) {
		console.error("Error seeding RBAC:", error);
		throw error;
	}
};

// Function to seed FAQs
export const seedFAQsDirect = async (payload: Payload) => {
	try {
		console.info("🔄 Clearing existing FAQs...");
		// Clear existing data
		await payload.delete({
			collection: "faqs",
			where: {
				id: {
					exists: true,
				},
			},
		});

		console.info("🔄 Loading FAQ content...");
		// Dynamically import the content to avoid circular dependencies
		const { content } = await import("@/content/faq/faq-content.tsx");

		console.info("🔄 Creating FAQs...");
		const faqs = content.map((faq, index) => ({
			question: faq.question,
			answer: createRichText(faq.answer),
			category: faq.category as Faq["category"],
			order: index + 1,
		}));

		const createdFAQs = await Promise.all(
			faqs.map(async (faq) => {
				try {
					const created = await payload.create({
						collection: "faqs",
						data: faq,
					});
					return created;
				} catch (error) {
					console.error(`Error creating FAQ: ${faq.question}`, error);
					return null;
				}
			})
		);

		const validFAQs = createdFAQs.filter(Boolean);
		console.info(`✅ Created ${validFAQs.length} FAQs`);
		return validFAQs;
	} catch (error) {
		console.error("Error seeding FAQs:", error);
		throw error;
	}
};

// Function to seed Features
export const seedFeaturesDirect = async (payload: Payload) => {
	try {
		console.info("🔄 Clearing existing Features...");
		// Clear existing data
		await payload.delete({
			collection: "features",
			where: {
				id: {
					exists: true,
				},
			},
		});

		console.info("🔄 Loading Features content...");
		// Dynamically import the content to avoid circular dependencies
		const { content } = await import("@/content/features/features-content");

		console.info("🔄 Creating Features...");
		const features = content.map((feature, index) => ({
			...feature,
			order: index + 1,
		}));

		const createdFeatures = await Promise.all(
			features.map(async (feature) => {
				try {
					const created = await payload.create({
						collection: "features",
						data: feature,
					});
					return created;
				} catch (error) {
					console.error(`Error creating feature: ${feature.name}`, error);
					return null;
				}
			})
		);

		const validFeatures = createdFeatures.filter(Boolean);
		console.info(`✅ Created ${validFeatures.length} features`);
		return validFeatures;
	} catch (error) {
		console.error("Error seeding features:", error);
		throw error;
	}
};

// Function to seed Testimonials
export const seedTestimonialsDirect = async (payload: Payload) => {
	try {
		console.info("🔄 Clearing existing Testimonials...");
		await payload.delete({
			collection: "testimonials",
			where: {
				id: {
					exists: true,
				},
			},
		});

		console.info("🔄 Loading Testimonials content...");
		// Dynamically import the content to avoid circular dependencies
		const { content } = await import("@/content/testimonials/testimonials-content");

		console.info("🔄 Creating Testimonials...");
		const testimonials = content
			.map((testimonial) => {
				const { image, ...rest } = testimonial;
				if (!testimonial.testimonial) {
					console.warn(`Testimonial text is missing for ${testimonial.name}`);
					return null;
				}
				return {
					...rest,
					name: testimonial.name!,
					testimonial: testimonial.testimonial,
					// If image is a string, set it to null for now since we need a Media relation
					image: null,
				};
			})
			.filter(Boolean);

		const createdTestimonials = await Promise.all(
			testimonials.map(async (testimonial) => {
				if (!testimonial || typeof testimonial?.name !== "string") {
					return null;
				}

				try {
					const created = await payload.create({
						collection: "testimonials",
						data: testimonial,
					});
					return created;
				} catch (error) {
					console.error(`Error creating testimonial: ${testimonial.name}`, error);
					return null;
				}
			})
		);

		const validTestimonials = createdTestimonials.filter(Boolean);
		console.info(`✅ Created ${validTestimonials.length} testimonials`);
		return validTestimonials;
	} catch (error) {
		console.error("Error seeding testimonials:", error);
		throw error;
	}
};

// Function to seed a demo page
export const seedDemoPageDirect = async (payload: Payload) => {
	try {
		console.info("🔄 Checking for existing demo page...");

		// Check if demo page already exists
		const existingPages = await payload.find({
			collection: "pages",
			where: {
				slug: {
					equals: "payload",
				},
			},
		});

		if (existingPages.docs.length > 0) {
			console.info("✅ Demo page already exists, skipping creation");
			return existingPages.docs[0];
		}

		console.info("🔄 Creating demo page...");

		// Get features for the features block
		const features = await payload.find({
			collection: "features",
			limit: 6,
		});

		// Get testimonials for the testimonials block
		const testimonials = await payload.find({
			collection: "testimonials",
			limit: 3,
		});

		// Create a hero block
		const heroBlock = {
			blockType: "hero" as const,
			heading: "Welcome to Payload CMS Demo",
			subheading:
				"This is a demonstration page showing the capabilities of Payload CMS in Shipkit. Payload CMS is a powerful headless CMS that allows you to create and manage content with ease.",
			ctaText: "Explore Admin",
			ctaLink: "/cms",
			style: "default" as const,
		};

		// Create a content block with a simpler structure
		const contentBlock = {
			blockType: "content" as const,
			content: createRichText(`
# Key Features

- Flexible content modeling with collections and fields
- Rich text editing with a powerful editor
- Media management for images and files
- User management and access control
- API-first architecture for headless content delivery

You can edit this page in the Payload CMS admin panel at /cms
			`),
			width: "default" as const,
			background: "none" as const,
		};

		// Create a features block
		const featuresBlock = {
			blockType: "features" as const,
			heading: "Powerful CMS Features",
			features: features.docs.map((feature) => feature.id),
			layout: "grid" as const,
			columns: "3" as const,
		};

		// Create a testimonials block
		const testimonialsBlock = {
			blockType: "testimonials" as const,
			heading: "What Users Say",
			testimonials: testimonials.docs.map((testimonial) => testimonial.id),
			layout: "grid" as const,
			background: "light" as const,
		};

		// Create the demo page
		const demoPage = await payload.create({
			collection: "pages",
			data: {
				title: "Payload CMS Demo",
				slug: "payload",
				meta: {
					title: "Payload CMS Demo | Shipkit",
					description: "A demonstration of Payload CMS capabilities in Shipkit",
				},
				layout: [heroBlock, contentBlock, featuresBlock, testimonialsBlock],
				publishedAt: new Date().toISOString(),
			},
		});

		console.info(`✅ Created demo page: ${demoPage.title}`);
		return demoPage;
	} catch (error) {
		console.error("Error seeding demo page:", error);
		throw error;
	}
};

// Main seed function that runs all seed functions
export const seedAllDirect = async (payload: Payload) => {
	try {
		console.info("🌱 Starting direct seeding process...");

		await seedRBACDirect(payload);
		await seedFAQsDirect(payload);
		await seedFeaturesDirect(payload);
		await seedTestimonialsDirect(payload);
		await seedDemoPageDirect(payload);

		console.info("✨ All collections seeded successfully!");
		return true;
	} catch (error) {
		console.error("❌ Error in direct seeding process:", error);
		return false;
	}
};
