"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
	{
		question: "Can I try before I buy?",
		answer: "Yes! We offer a 14-day free trial on all paid plans. No credit card required.",
	},
	{
		question: "How does billing work?",
		answer:
			"You'll be billed monthly or annually, depending on your preference. We accept all major credit cards and PayPal.",
	},
	{
		question: "Can I change plans later?",
		answer:
			"Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
	},
	{
		question: "What's included in the free plan?",
		answer:
			"The free plan includes all essential features to get you started, with some usage limitations.",
	},
];

export function FAQSection() {
	return (
		<div className="max-w-3xl mx-auto mt-20">
			<h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
			<Accordion type="single" collapsible className="w-full">
				{faqs.map((faq, index) => (
					<AccordionItem key={faq.question} value={`item-${index}`}>
						<AccordionTrigger>{faq.question}</AccordionTrigger>
						<AccordionContent>{faq.answer}</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
}
