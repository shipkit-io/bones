import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { TestimonialsBlock } from "@/types/blocks";

interface TestimonialsProps {
	block: TestimonialsBlock;
	className?: string;
}

export const Testimonials = ({ block, className }: TestimonialsProps) => {
	const { heading, testimonials, layout = "grid", background = "none" } = block;

	const renderTestimonial = (testimonial: any) => (
		<Card className="h-full">
			<CardContent className="pt-6">
				<div className="mb-4 flex items-center gap-4">
					<Avatar>
						{testimonial.image ? (
							<AvatarImage src={testimonial.image.url} alt={testimonial.name} />
						) : (
							<AvatarFallback>{testimonial.name[0]}</AvatarFallback>
						)}
					</Avatar>
					<div>
						<div className="font-semibold">{testimonial.name}</div>
						{testimonial.title && (
							<div className="text-sm text-muted-foreground">{testimonial.title}</div>
						)}
					</div>
				</div>
				<blockquote className="text-muted-foreground">{testimonial.content}</blockquote>
			</CardContent>
		</Card>
	);

	return (
		<section
			className={cn(
				"py-16",
				{
					"bg-muted": background === "light",
					"bg-primary text-primary-foreground": background === "dark",
				},
				className
			)}
		>
			<div className="container mx-auto px-4">
				{heading && (
					<h2 className="mb-12 text-center text-3xl font-bold tracking-tighter sm:text-4xl">
						{heading}
					</h2>
				)}

				{layout === "grid" && (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{testimonials.map((testimonial) => (
							<div key={testimonial.id}>{renderTestimonial(testimonial)}</div>
						))}
					</div>
				)}

				{layout === "slider" && (
					<Carousel className="w-full max-w-5xl mx-auto">
						<CarouselContent>
							{testimonials.map((testimonial) => (
								<CarouselItem key={testimonial.id} className="md:basis-1/2">
									{renderTestimonial(testimonial)}
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious />
						<CarouselNext />
					</Carousel>
				)}

				{layout === "single" && (
					<div className="max-w-3xl mx-auto">
						{testimonials.slice(0, 1).map((testimonial) => (
							<div key={testimonial.id}>{renderTestimonial(testimonial)}</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
};
