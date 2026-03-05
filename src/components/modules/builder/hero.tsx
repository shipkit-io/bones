import * as React from "react";
import { Button } from "@/components/ui/button";

interface HeroProps {
	title: string;
	subtitle: string;
	buttonText: string;
	buttonLink: string;
	backgroundImage?: string;
}

export const Hero = ({ title, subtitle, buttonText, buttonLink, backgroundImage }: HeroProps) => {
	return (
		<div className="relative min-h-[600px] flex items-center justify-center">
			{/* Background Image with Overlay */}
			{backgroundImage && (
				<div
					className="absolute inset-0 z-0"
					style={{
						backgroundImage: `url(${backgroundImage})`,
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				>
					<div className="absolute inset-0 bg-black/50" />
				</div>
			)}

			{/* Content */}
			<div className="relative z-10 container mx-auto px-4 text-center">
				<h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">{title}</h1>
				<p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">{subtitle}</p>
				<Button size="lg" asChild className="bg-primary hover:bg-primary/90">
					<a href={buttonLink}>{buttonText}</a>
				</Button>
			</div>
		</div>
	);
};
