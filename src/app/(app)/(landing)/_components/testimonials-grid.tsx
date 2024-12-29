import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getPayloadContent } from "@/lib/utils/get-payload-content";
import { cn } from "@/lib/utils";
import type { Media, Testimonial } from "@/payload-types";

// Make StaticTestimonial match Payload's type structure
type StaticTestimonial = Omit<Testimonial, 'id' | 'updatedAt' | 'createdAt'> & {
	id?: string;
};

const getImageUrl = (image: unknown): string | undefined => {
	if (!image) return undefined;
	if (typeof image === "string") return image;
	if (typeof image === "object" && image && "url" in image) {
		const url = (image as Media).url;
		return url ?? undefined;
	}
	return undefined;
};

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial | StaticTestimonial }) => {
	const imageUrl = getImageUrl(testimonial.image);
	const name = testimonial.name || "Anonymous";

	return (
		<figure
			className={cn(
				"relative w-80 cursor-pointer overflow-hidden rounded-xl border p-4",
				"transform-gpu transition-all duration-300 ease-out hover:scale-[1.02]",
				// light styles
				"border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
				// dark styles
				"dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
			)}
		>
			<div className="flex flex-row items-start justify-between">
				<div className="flex items-center gap-3">
					<Avatar>
						{imageUrl && <AvatarImage src={imageUrl} alt={name} />}
						<AvatarFallback>{name.charAt(0)}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<div className="flex items-center gap-2">
							<figcaption className="text-sm font-medium dark:text-white">
								{name}
							</figcaption>
							{testimonial.verified && (
								<Badge variant="secondary" className="h-5 px-1">
									Verified
								</Badge>
							)}
						</div>
						<p className="text-xs font-medium text-muted-foreground">
							{testimonial.role} at {testimonial.company}
						</p>
						{testimonial.username && (
							<p className="text-xs font-medium dark:text-white/40">
								{testimonial.username}
							</p>
						)}
					</div>
				</div>
			</div>
			<blockquote className="mt-4 text-sm leading-relaxed">
				{testimonial.testimonial}
			</blockquote>
		</figure>
	);
};

export async function TestimonialsGrid() {
	let testimonials: (Testimonial | StaticTestimonial)[] = [];

	try {
		testimonials = await getPayloadContent<"testimonials", StaticTestimonial[]>({
			collection: "testimonials",
			options: {
				where: {
					featured: {
						equals: true,
					},
				},
				depth: 1,
				sort: "-createdAt",
			},
			fallbackImport: async () => {
				const { content } = await import("@/content/testimonials/testimonials-content");
				return { content: content as StaticTestimonial[] };
			},
		});
	} catch (error) {
		console.error("Error loading testimonials:", error);
		return null;
	}

	if (!testimonials?.length) {
		return null;
	}

	const firstRow = testimonials.slice(0, Math.ceil(testimonials.length / 2));
	const secondRow = testimonials.slice(Math.ceil(testimonials.length / 2));

	return (
		<div className="relative flex flex-col gap-8">
			<div className="flex animate-marquee gap-8">
				{firstRow.map((testimonial) => (
					<TestimonialCard
						key={"id" in testimonial ? testimonial.id : testimonial.name}
						testimonial={testimonial}
					/>
				))}
			</div>
			<div className="animate-marquee-reverse flex gap-8">
				{secondRow.map((testimonial) => (
					<TestimonialCard
						key={"id" in testimonial ? testimonial.id : testimonial.name}
						testimonial={testimonial}
					/>
				))}
			</div>
		</div>
	);
}
