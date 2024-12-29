import { GradientCard } from "@/components/ui/cui/gradient-card";

interface CardData {
	className?: string;
	description: string;
	title: string;
	content?: string;
}

interface GradientCardsProps {
	cards: CardData[];
}

export const GradientCards: React.FC<GradientCardsProps> = ({ cards }) => {
	return (
		<div
			className={`relative grid w-5/6 grid-cols-1 gap-2 p-2 md:grid-cols-${Math.min(cards.length, 4)}`}
		>
			{cards.map((card, index) => (
				<GradientCard
					key={index}
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
