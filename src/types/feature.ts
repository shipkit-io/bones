export type FeatureCategory =
	| "core"
	| "dx"
	| "backend"
	| "advanced"
	| "security"
	| "devops"
	| "support";

export type FeaturePlan = "bones" | "muscles" | "brains";

export interface Feature {
	id: number;
	name: string;
	description: string;
	category: FeatureCategory;
	plans: FeaturePlan[];
	icon?: string;
	order?: number;
	badge?: "new" | "popular" | "pro";
}
