import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { FeaturesBlock } from "@/types/blocks";

interface FeaturesProps {
	block: FeaturesBlock;
	className?: string;
}

export const Features = ({ block, className }: FeaturesProps) => {
	const { heading, features, layout = "grid", columns = "3" } = block;

	const renderFeature = (feature: any) => (
		<Card className="h-full">
			<CardHeader>
				{feature.icon && (
					<div className="mb-2 h-12 w-12 rounded-lg bg-primary/10 p-2.5">
						<feature.icon className="h-full w-full text-primary" />
					</div>
				)}
				<CardTitle>{feature.name}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">{feature.description}</p>
			</CardContent>
		</Card>
	);

	return (
		<section className={cn("py-16", className)}>
			<div className="container mx-auto px-4">
				{heading && (
					<h2 className="mb-12 text-center text-3xl font-bold tracking-tighter sm:text-4xl">
						{heading}
					</h2>
				)}

				{layout === "grid" && (
					<div
						className={cn("grid gap-6", {
							"grid-cols-1 md:grid-cols-2": columns === "2",
							"grid-cols-1 md:grid-cols-3": columns === "3",
							"grid-cols-1 md:grid-cols-2 lg:grid-cols-4": columns === "4",
						})}
					>
						{features.map((feature) => (
							<div key={feature.id}>{renderFeature(feature)}</div>
						))}
					</div>
				)}

				{layout === "list" && (
					<div className="space-y-6">
						{features.map((feature) => (
							<div key={feature.id} className="max-w-3xl mx-auto">
								{renderFeature(feature)}
							</div>
						))}
					</div>
				)}

				{layout === "carousel" && (
					<Carousel className="w-full max-w-5xl mx-auto">
						<CarouselContent>
							{features.map((feature) => (
								<CarouselItem key={feature.id} className="md:basis-1/2 lg:basis-1/3">
									{renderFeature(feature)}
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious />
						<CarouselNext />
					</Carousel>
				)}
			</div>
		</section>
	);
};
