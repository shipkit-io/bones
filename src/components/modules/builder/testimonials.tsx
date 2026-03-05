"use client";

import { Builder } from "@builder.io/react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Testimonial {
	quote: string;
	author: string;
	role: string;
	image?: string;
}

interface TestimonialsProps {
	title: string;
	subtitle: string;
	testimonials: Testimonial[];
}

export const Testimonials = ({ title, subtitle, testimonials }: TestimonialsProps) => {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
	const [canScrollPrev, setCanScrollPrev] = React.useState(false);
	const [canScrollNext, setCanScrollNext] = React.useState(false);

	const scrollPrev = React.useCallback(() => {
		if (emblaApi) emblaApi.scrollPrev();
	}, [emblaApi]);

	const scrollNext = React.useCallback(() => {
		if (emblaApi) emblaApi.scrollNext();
	}, [emblaApi]);

	const onSelect = React.useCallback((emblaApi: any) => {
		setCanScrollPrev(emblaApi.canScrollPrev());
		setCanScrollNext(emblaApi.canScrollNext());
	}, []);

	React.useEffect(() => {
		if (!emblaApi) return;

		onSelect(emblaApi);
		emblaApi.on("select", onSelect);
		emblaApi.on("reInit", onSelect);
	}, [emblaApi, onSelect]);

	return (
		<section className="py-20 bg-gray-50">
			<div className="container mx-auto px-4">
				{/* Header */}
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
				</div>

				{/* Carousel */}
				<div className="relative max-w-4xl mx-auto">
					<div className="overflow-hidden" ref={emblaRef}>
						<div className="flex">
							{testimonials.map((testimonial, index) => (
								<div key={index} className="flex-[0_0_100%] min-w-0 pl-4 relative">
									<div className="bg-white p-8 rounded-lg shadow-sm">
										<div className="flex items-center mb-6">
											{testimonial.image && (
												<div className="mr-4">
													<img
														src={testimonial.image}
														alt={testimonial.author}
														className="w-12 h-12 rounded-full object-cover"
													/>
												</div>
											)}
											<div>
												<div className="font-semibold">{testimonial.author}</div>
												<div className="text-gray-600 text-sm">{testimonial.role}</div>
											</div>
										</div>
										<blockquote className="text-lg text-gray-700">"{testimonial.quote}"</blockquote>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Navigation Buttons */}
					<Button
						variant="outline"
						size="icon"
						className={cn(
							"absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full",
							!canScrollPrev && "opacity-50 cursor-not-allowed"
						)}
						onClick={scrollPrev}
						disabled={!canScrollPrev}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className={cn(
							"absolute right-0 top-1/2 -translate-y-1/2 translate-x-full",
							!canScrollNext && "opacity-50 cursor-not-allowed"
						)}
						onClick={scrollNext}
						disabled={!canScrollNext}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</section>
	);
};

// Register the component with Builder.io
Builder.registerComponent(Testimonials, {
	name: "Testimonials",
	inputs: [
		{
			name: "title",
			type: "string",
			defaultValue: "What Our Customers Say",
		},
		{
			name: "subtitle",
			type: "string",
			defaultValue: "Hear from our satisfied customers",
		},
		{
			name: "testimonials",
			type: "list",
			defaultValue: [
				{
					quote: "This product has completely transformed how we work.",
					author: "John Doe",
					role: "CEO at Company",
					image: "",
				},
				{
					quote: "The best solution we have found in the market.",
					author: "Jane Smith",
					role: "Director of Operations",
					image: "",
				},
			],
			subFields: [
				{
					name: "quote",
					type: "string",
				},
				{
					name: "author",
					type: "string",
				},
				{
					name: "role",
					type: "string",
				},
				{
					name: "image",
					type: "string",
				},
			],
		},
	],
});
