import { content } from "@/content/features/features-content";
import { cn } from "@/lib/utils";
import { FeatureCard } from "./feature-card";

export function FeaturesGridDynamic() {
	const features = content
		.filter((feature) => feature.category === "core")
		.sort((a, b) => (a.order || 0) - (b.order || 0))
		.slice(0, 6);

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
			{features.map((feature) => (
				<FeatureCard key={feature.id} feature={feature} />
			))}
		</div>
	);
}
