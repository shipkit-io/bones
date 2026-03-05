"use client";

import { Section, SectionHeader } from "@/components/primitives/section";
import { GradientCards } from "./gradient-cards";

interface FeaturesCardsClientProps {
    cards: Array<{
        title: string;
        description: string;
    }>;
}

export function FeaturesCardsClient({ cards }: FeaturesCardsClientProps) {
    if (!cards.length) {
        return null;
    }

    return (
        <Section variant="default" size="full">
            <SectionHeader className="text-center">Why Choose ShipKit?</SectionHeader>
            <GradientCards cards={cards} className="mx-auto" />
        </Section>
    );
}
