import { cn } from "@/lib/utils";
import { getPayloadContent } from "@/lib/utils/get-payload-content";
import type { FeatureCategory, FeaturePlan } from "@/types/feature";
import { v4 as uuidv4 } from "uuid";
import { FeatureCard } from "./feature-card";

type PayloadFeature = {
	id?: number;
	name: string;
	description: string;
	category: FeatureCategory;
	plans: FeaturePlan[];
	icon?: string | null;
	order?: number | null;
	badge?: "new" | "popular" | "pro" | null;
};

export async function FeaturesGridDynamic() {
	let features: PayloadFeature[] = [];

	try {
		features = await getPayloadContent<"features", PayloadFeature[]>({
			collection: "features",
			options: { sort: "-order" },
			fallbackImport: () => import("@/content/features/features-content"),
		});
	} catch (error) {
		console.error("Error loading features:", error);
		return null;
	}

	if (!features.length) {
		return null;
	}

	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3",
				"relative mx-auto max-w-5xl px-4",
			)}
		>
			{features.map((feature, index) => {
				const id = feature.id || index;
				return (
					<FeatureCard
						key={uuidv4()}
						feature={{
							...feature,
							id: Number(id),
							icon: feature.icon || undefined,
							order: feature.order || undefined,
							badge: feature.badge || undefined,
						}}
					/>
				);
			})}
		</div>
	);
}
