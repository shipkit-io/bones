import type { Media } from "@/payload-types";

export type HeroBlock = {
	blockType: "hero";
	heading: string;
	subheading?: string;
	image?: Media;
	ctaText?: string;
	ctaLink?: string;
};

export type ContentBlock = {
	blockType: "content";
	content: any; // Lexical editor content
};

export type FeaturesBlock = {
	blockType: "features";
	heading?: string;
	features: {
		id: string;
		relationTo: "features";
	}[];
};

export type TestimonialsBlock = {
	blockType: "testimonials";
	heading?: string;
	testimonials: {
		id: string;
		relationTo: "testimonials";
	}[];
};

export type PageBlock =
	| HeroBlock
	| ContentBlock
	| FeaturesBlock
	| TestimonialsBlock;

export interface Page {
	id: string;
	title: string;
	slug: string;
	meta?: {
		title?: string;
		description?: string;
		image?: Media;
	};
	layout: PageBlock[];
	publishedAt?: string;
	createdAt: string;
	updatedAt: string;
}
