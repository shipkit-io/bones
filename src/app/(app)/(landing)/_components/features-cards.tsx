import { GradientCards } from "@/app/(app)/(landing)/_components/gradient-cards";
import { Section, SectionHeader } from "@/components/primitives/section";
import { getPayloadContent } from "@/lib/utils/get-payload-content";
import type { Feature } from "@/payload-types";

type StaticFeature = {
	name: string;
	description: string;
	category: string;
	order?: number;
};

export const FeaturesCards = async () => {
	let features: (Feature | StaticFeature)[] = [];

	try {
		features = await getPayloadContent<"features", StaticFeature[]>({
			collection: "features",
			options: { sort: "order" },
			fallbackImport: () => import("@/content/features/features-content"),
		});
	} catch (error) {
		console.error("Error loading features:", error);
		return null;
	}

	const coreFeatures = features.filter(
		(feature) => feature.category === "core"
	).sort((a, b) => (a.order || 0) - (b.order || 0));

	if (!coreFeatures.length) {
		return null;
	}

	const cards = coreFeatures.map((feature) => ({
		title: feature.name,
		description: feature.description,
	}));

	return (
		<Section variant="default" size="wide">
			<SectionHeader>Why Choose ShipKit?</SectionHeader>
			<GradientCards cards={cards} />
		</Section>
	);
};
