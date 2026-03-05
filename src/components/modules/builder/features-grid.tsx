"use client";

import { Builder } from "@builder.io/react";
import { cn } from "@/lib/utils";

interface Feature {
	title: string;
	description: string;
	icon?: string;
}

interface FeaturesGridProps {
	title: string;
	subtitle: string;
	features: Feature[];
	columns?: 2 | 3 | 4;
}

export const FeaturesGrid = ({ title, subtitle, features, columns = 3 }: FeaturesGridProps) => {
	return (
		<section className="py-20 bg-white">
			<div className="container mx-auto px-4">
				{/* Header */}
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
				</div>

				{/* Features Grid */}
				<div
					className={cn("grid gap-8", {
						"grid-cols-1 md:grid-cols-2": columns === 2,
						"grid-cols-1 md:grid-cols-3": columns === 3,
						"grid-cols-1 md:grid-cols-2 lg:grid-cols-4": columns === 4,
					})}
				>
					{features.map((feature, index) => (
						<div
							key={index}
							className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
						>
							{feature.icon && (
								<div className="w-12 h-12 mb-4">
									<img src={feature.icon} alt="" className="w-full h-full object-contain" />
								</div>
							)}
							<h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
							<p className="text-gray-600">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

// Register the component with Builder.io
Builder.registerComponent(FeaturesGrid, {
	name: "FeaturesGrid",
	inputs: [
		{
			name: "title",
			type: "string",
			defaultValue: "Our Features",
		},
		{
			name: "subtitle",
			type: "string",
			defaultValue: "Everything you need to succeed",
		},
		{
			name: "columns",
			type: "number",
			defaultValue: 3,
			enum: [
				{ label: "2 Columns", value: 2 },
				{ label: "3 Columns", value: 3 },
				{ label: "4 Columns", value: 4 },
			],
		},
		{
			name: "features",
			type: "list",
			defaultValue: [
				{
					title: "Feature 1",
					description: "Description of feature 1",
					icon: "",
				},
				{
					title: "Feature 2",
					description: "Description of feature 2",
					icon: "",
				},
				{
					title: "Feature 3",
					description: "Description of feature 3",
					icon: "",
				},
			],
			subFields: [
				{
					name: "title",
					type: "string",
				},
				{
					name: "description",
					type: "string",
				},
				{
					name: "icon",
					type: "string",
				},
			],
		},
	],
});
