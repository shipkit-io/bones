import { seedFAQs } from "./faqs";
import { seedFeatures } from "./features";
import { seedRbac } from "./rbac";
import { seedTestimonials } from "./testimonials";

export const seed = async () => {
	try {
		// Seed new data
		await seedRbac();
		await seedFAQs();
		await seedFeatures();
		await seedTestimonials();

		console.info("✨ Seed completed successfully!");
	} catch (error) {
		console.error("Error seeding data:", error);
		throw error;
	}
};
