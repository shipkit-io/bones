import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { getPayloadContent } from "@/lib/utils/get-payload-content";
import type { Faq } from "@/payload-types";
import type { HTMLAttributes } from "react";

type StaticFaq = {
	id?: string;
	question: string;
	answer: unknown;
	category: string;
};

type FaqType = Faq | StaticFaq;

const serializeAnswer = (answer: unknown): string => {
	if (typeof answer === 'string') return answer;
	return JSON.stringify(answer);
};

export const FAQ = async (props: HTMLAttributes<HTMLDivElement>) => {
	let faqs: FaqType[] = [];

	try {
		faqs = await getPayloadContent<"faqs", StaticFaq[]>({
			collection: "faqs",
			options: { sort: "-order" },
			fallbackImport: () => import("@/content/faq/faq-content"),
		});
	} catch (error) {
		console.error("Error loading FAQs:", error);
		return null;
	}

	if (!faqs?.length) {
		return null;
	}

	return (
		<div {...props} className={cn("w-full", props?.className)}>
			<Accordion type="single" collapsible className="w-full">
				{faqs.map((faq) => {
					const id = "id" in faq && faq.id ? faq.id.toString() : faq.question;

					return (
						<AccordionItem key={id} value={id}>
							<AccordionTrigger className="text-xl font-medium tracking-tight text-neutral-800 dark:text-neutral-100">
								{faq.question}
							</AccordionTrigger>
							<AccordionContent className="mt-2 leading-6 text-neutral-700 dark:text-neutral-400">
								<div className="whitespace-pre-line">
									{serializeAnswer(faq.answer)}
								</div>
							</AccordionContent>
						</AccordionItem>
					);
				})}
			</Accordion>
		</div>
	);
};
