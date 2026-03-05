import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeroBlock } from "@/types/blocks";

interface HeroProps {
	block: HeroBlock;
	className?: string;
}

export const Hero = ({ block, className }: HeroProps) => {
	const { heading, subheading, image, ctaText, ctaLink, style = "default" } = block;

	return (
		<section
			className={cn(
				"relative overflow-hidden py-20",
				{
					"text-center": style === "centered",
					"grid grid-cols-2 items-center gap-12": style === "split",
				},
				className
			)}
		>
			{/* Background image for default and centered styles */}
			{image?.url && (style === "default" || style === "centered") && (
				<div className="absolute inset-0 -z-10">
					<Image src={image.url} alt={heading} fill className="object-cover opacity-20" priority />
				</div>
			)}

			<div
				className={cn("container mx-auto px-4", {
					"max-w-4xl": style === "centered",
				})}
			>
				<div className="space-y-6">
					<h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{heading}</h1>
					{subheading && <p className="text-xl text-muted-foreground">{subheading}</p>}
					{ctaText && ctaLink && (
						<div className="pt-4">
							<Button asChild size="lg">
								<Link href={ctaLink}>{ctaText}</Link>
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Side image for split layout */}
			{image?.url && style === "split" && (
				<div className="relative aspect-square w-full">
					<Image src={image.url} alt={heading} fill className="object-cover" priority />
				</div>
			)}
		</section>
	);
};
