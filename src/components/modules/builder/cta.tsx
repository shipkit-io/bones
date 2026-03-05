"use client";

import { Builder } from "@builder.io/react";
import * as React from "react";
import { Button } from "@/components/ui/button";

interface CTAButton {
	text: string;
	link: string;
	variant?: "default" | "secondary" | "outline";
}

interface CTAProps {
	title: string;
	description: string;
	backgroundImage?: string;
	primaryButton: CTAButton;
	secondaryButton?: CTAButton;
}

export const CTA = ({
	title,
	description,
	backgroundImage,
	primaryButton,
	secondaryButton,
}: CTAProps) => {
	return (
		<section className="relative py-20">
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
					<div className="absolute inset-0 bg-black/60" />
				</div>
			)}

			{/* Content */}
			<div className="relative z-10 container mx-auto px-4">
				<div className="max-w-3xl mx-auto text-center">
					<h2
						className={`text-3xl md:text-4xl font-bold mb-6 ${
							backgroundImage ? "text-white" : "text-gray-900"
						}`}
					>
						{title}
					</h2>
					<p className={`text-lg mb-8 ${backgroundImage ? "text-gray-200" : "text-gray-600"}`}>
						{description}
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button asChild variant={primaryButton.variant || "default"} size="lg">
							<a href={primaryButton.link}>{primaryButton.text}</a>
						</Button>
						{secondaryButton && (
							<Button asChild variant={secondaryButton.variant || "outline"} size="lg">
								<a href={secondaryButton.link}>{secondaryButton.text}</a>
							</Button>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};

// Register the component with Builder.io
Builder.registerComponent(CTA, {
	name: "CTA",
	inputs: [
		{
			name: "title",
			type: "string",
			defaultValue: "Ready to Get Started?",
		},
		{
			name: "description",
			type: "string",
			defaultValue: "Join thousands of satisfied customers who have already taken the next step.",
		},
		{
			name: "backgroundImage",
			type: "string",
			defaultValue: "",
		},
		{
			name: "primaryButton",
			type: "object",
			defaultValue: {
				text: "Get Started",
				link: "#",
				variant: "default",
			},
			subFields: [
				{
					name: "text",
					type: "string",
				},
				{
					name: "link",
					type: "string",
				},
				{
					name: "variant",
					type: "string",
					enum: ["default", "secondary", "outline"],
				},
			],
		},
		{
			name: "secondaryButton",
			type: "object",
			defaultValue: {
				text: "Learn More",
				link: "#",
				variant: "outline",
			},
			subFields: [
				{
					name: "text",
					type: "string",
				},
				{
					name: "link",
					type: "string",
				},
				{
					name: "variant",
					type: "string",
					enum: ["default", "secondary", "outline"],
				},
			],
		},
	],
});
