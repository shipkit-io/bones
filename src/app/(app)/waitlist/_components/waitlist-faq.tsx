import { HelpCircle, MessageCircle } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
	{
		question: "How is this different from other Next.js starters?",
		answer:
			"Most starters give you a basic setup and call it a day. We've built production apps with this stack and fixed all the edge cases. Auth that handles email verification, payments with working webhooks, database migrations that don't break. It's the difference between a demo and something you can ship to customers.",
	},
	{
		question: "Can I remove features I don't need?",
		answer:
			"Yes. Everything is modular and documented. Don't need payments? Delete the Stripe folder. Don't want the CMS? Remove Payload. Each feature is self-contained with clear removal instructions.",
	},
	{
		question: "How much time will this save me?",
		answer:
			"Beta testers report 2-4 weeks saved on average. Authentication alone usually takes a week if done right. Add payments, email templates, database setup, deployment configs... One founder launched their MVP in 4 days instead of 2 months.",
	},
	{
		question: "What's the early access pricing?",
		answer:
			"50% off the regular price for early access members, locked in forever. Think 'reasonable for an indie developer, cheap for a team.' Way less than you'd pay a contractor to build this from scratch.",
	},
	{
		question: "When will this be available?",
		answer:
			"March 2025. We're making sure everything works in production rather than rushing to meet a deadline. Better to launch right than launch fast.",
	},
];

export function WaitlistFAQ() {
	return (
		<div className="py-24 bg-slate-50/50 dark:bg-slate-900/50">
			<div className="container px-4 md:px-6">
				<div className="mx-auto max-w-3xl">
					<div className="text-center mb-12">
						<Badge
							variant="outline"
							className="mb-4 border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-300"
						>
							Common Questions
						</Badge>
						<h2 className="mb-4 text-3xl md:text-4xl font-bold tracking-tight">
							Frequently Asked Questions
						</h2>
						<p className="text-lg text-slate-600 dark:text-slate-300">
							Real questions from real developers with honest answers.
						</p>
					</div>

					<Card className="border-slate-200 dark:border-slate-800 mb-8">
						<CardContent className="p-8">
							<Accordion type="single" collapsible className="w-full">
								{faqs.map((faq, index) => (
									<AccordionItem
										key={index}
										value={`item-${index}`}
										className="border-slate-200 dark:border-slate-700"
									>
										<AccordionTrigger className="text-left hover:no-underline group">
											<div className="flex items-start gap-3">
												<HelpCircle className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
												<span className="text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
													{faq.question}
												</span>
											</div>
										</AccordionTrigger>
										<AccordionContent className="text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
											{faq.answer}
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</CardContent>
					</Card>

					<div className="text-center">
						<div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
							<MessageCircle className="h-8 w-8 text-violet-600 dark:text-violet-400 mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
								Still have questions?
							</h3>
							<p className="text-slate-600 dark:text-slate-300 mb-4">
								No sales pressure, just honest answers from developers who've been there.
							</p>
							<a
								href="mailto:hey@shipkit.io"
								className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
							>
								Email us →
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
