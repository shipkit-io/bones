"use client";

import { GradientCard } from "@/components/ui/cui/gradient-card";
import { cn } from "@/lib/utils";
import type React from "react";
import { v4 as uuidv4 } from "uuid";

interface CardData {
	className?: string;
	description: string;
	title: string;
	content?: string;
}

interface GradientCardsProps {
	cards: CardData[];
	className?: string;
}

export const GradientCards: React.FC<GradientCardsProps> = ({ cards, className }) => {
	return (
		<div
			className={cn(`mx-auto relative grid w-5/6 grid-cols-1 gap-2 p-2 md:grid-cols-${Math.min(cards.length, 4)}`, className)}
		>
			{cards.map((card) => (
				<GradientCard
					key={uuidv4()}
					className={card.className ?? "p-4"}
					description={card.description}
					title={card.title}
				>
					{card.content}
				</GradientCard>
			))}
		</div>
	);
};
