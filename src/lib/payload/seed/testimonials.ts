import { content } from "@/content/testimonials/testimonials-content";
import { getPayloadClient } from "@/lib/payload/payload";

export const seedTestimonials = async () => {
	const payload = await getPayloadClient();
	if (!payload) {
		console.debug("Payload not available, skipping testimonials seeding");
		return [];
	}

	try {
		await payload.delete({
			collection: "testimonials",
			where: {
				id: {
					exists: true,
				},
			},
		});

		const testimonials = content.map((testimonial) => {
			const { image, ...rest } = testimonial;
			if (!testimonial.testimonial) {
				throw new Error(`Testimonial text is required for ${testimonial.name}`);
			}
			return {
				...rest,
				name: testimonial.name!,
				testimonial: testimonial.testimonial,
				// If image is a string, set it to null for now since we need a Media relation
				image: null,
			};
		});

		const createdTestimonials = await Promise.all(
			testimonials.map(async (testimonial) => {
				if (typeof testimonial?.name !== "string") {
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
					throw error;
				}
			})
		);

		console.info(`✅ Created ${createdTestimonials.length} testimonials`);
		return createdTestimonials;
	} catch (error) {
		console.error("Error seeding testimonials:", error);
		throw error;
	}
};
