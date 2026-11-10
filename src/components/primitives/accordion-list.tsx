import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

export interface AccordionListItem {
  title: string;
  content: React.ReactNode;
}

/** The single-value variant, which is the one this list renders. */
type SingleAccordionProps = Extract<React.ComponentProps<typeof Accordion>, { type: "single" }>;

interface AccordionListProps {
  items: AccordionListItem[];
  accordionProps?: Partial<Omit<SingleAccordionProps, "type" | "children">>;
}

export const AccordionList: React.FC<AccordionListProps> = ({ items, accordionProps }) => {
  return (
    <Accordion type="single" collapsible {...accordionProps}>
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
        <AccordionItem key={index} value={`item-${index + 1}`} className="">
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>
            <div className="px-sm">
              <Separator />
            </div>
            <p className="pt-md">{item.content}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
