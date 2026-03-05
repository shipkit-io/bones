import type { Media } from "@/payload-types";

export interface HeroBlock {
	blockType: "hero";
	heading: string;
	subheading?: string;
	image?: Media;
	ctaText?: string;
	ctaLink?: string;
	style?: "default" | "centered" | "split";
}

export interface ContentBlock {
	blockType: "content";
	content: any; // Lexical editor content
	width?: "default" | "wide" | "narrow";
	background?: "none" | "gray" | "accent";
}

export interface FeaturesBlock {
	blockType: "features";
	heading?: string;
	features: {
		id: string;
		relationTo: "features";
	}[];
	layout?: "grid" | "list" | "carousel";
	columns?: "2" | "3" | "4";
}

export interface TestimonialsBlock {
	blockType: "testimonials";
	heading?: string;
	testimonials: {
		id: string;
		relationTo: "testimonials";
	}[];
	layout?: "grid" | "slider" | "single";
	background?: "none" | "light" | "dark";
}

export type PageBlock = HeroBlock | ContentBlock | FeaturesBlock | TestimonialsBlock;

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
