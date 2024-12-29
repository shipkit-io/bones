import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";
import { getPayloadContent } from "@/lib/utils/get-payload-content";
import type { Faq } from "@/payload-types";

// Define types for static content structure
type StaticFaq = {
	id?: string;
	question: string;
	answer: string;
	category: string;
	order?: number;
};

const getAnswerText = (answer: unknown): string => {
	if (typeof answer === "string") return answer;
	if (typeof answer === "object" && answer && "root" in answer) {
		const richText = answer as { root: { children: { children?: { text: string }[] }[] } };
		return richText.root.children
			.map(child => child.children?.[0]?.text || "")
			.join("\n");
	}
	return "";
};

export default async function FaqPage() {
	let faqs: (Faq | StaticFaq)[] = [];

	try {
		faqs = await getPayloadContent<"faqs", StaticFaq[]>({
			collection: "faqs",
			options: { sort: "-order" },
			fallbackImport: async () => {
				const { content } = await import("@/content/faq/faq-content");
				// The content is already in the correct format for static FAQs
				return { content };
			},
		});
	} catch (error) {
		console.error("Error loading FAQs:", error);
		return null;
	}

	if (!faqs?.length) {
		return null;
	}

	return (
		<section className="container mx-auto mt-header space-y-section py-16">
			<div className="grid w-full grid-cols-1 md:grid-cols-5">
				<div className="z-10 col-span-2 bg-neutral-50 p-12 dark:bg-neutral-900">
					<h2 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
						Frequently Asked Questions
					</h2>
					<p className="mb-8 text-neutral-600 dark:text-neutral-300">
						Here are some common questions about {siteConfig.name}. If you have
						any other questions, feel free to reach out to us.
					</p>
				</div>
				<div className="col-span-3 space-y-8 border-t border-neutral-400/15 bg-white px-20 py-12 dark:bg-neutral-950 md:border-l md:border-t-0">
					<Accordion type="single" collapsible className="w-full">
						{faqs.map((faq) => {
							const id = "id" in faq && faq.id ? faq.id.toString() : faq.question;
							const answerText = getAnswerText(faq.answer);

							return (
								<AccordionItem key={id} value={id}>
									<AccordionTrigger className="text-xl font-medium tracking-tight text-neutral-800 dark:text-neutral-100">
										{faq.question}
									</AccordionTrigger>
									<AccordionContent className="mt-2 leading-6 text-neutral-700 dark:text-neutral-400">
										<p className="whitespace-pre-line">{answerText}</p>
									</AccordionContent>
								</AccordionItem>
							);
						})}
					</Accordion>
				</div>
			</div>
		</section>
	);
}
