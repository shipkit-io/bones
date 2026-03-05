import { getPayloadContent } from "@/lib/utils/get-payload-content";
import { FeaturesCardsClient } from "./features-cards-client";

type StaticFeature = {
	name: string;
	description: string;
	category: string;
	order?: number;
};

async function getFeatures() {
	try {
		const features = await getPayloadContent<"features", StaticFeature[]>({
			collection: "features",
			options: { sort: "order" },
			fallbackImport: () => import("@/content/features/features-content"),
		});

		return features
			.sort((a, b) => (a.order || 0) - (b.order || 0))
			.map((feature) => ({
				title: feature.name,
				description: feature.description,
			}));
	} catch (error) {
		console.error("Error loading features:", error);
		return [];
	}
}

export const FeaturesCards = async () => {
	const cards = await getFeatures();

	if (!cards.length) {
		return null;
	}

	return <FeaturesCardsClient cards={cards} />;
};
