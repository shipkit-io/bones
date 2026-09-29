import * as RadixIcons from "@radix-ui/react-icons";
import * as LucideIcons from "lucide-react";
import type { MDXComponents } from "mdx/types";
import { isValidElementType } from "react-is";
import { Card } from "@/components/modules/mdx/card";
import { CardGroup } from "@/components/modules/mdx/card-group";
import { SecretGenerator } from "@/components/modules/mdx/secret-generator";
import { AskAiButtons } from "@/components/primitives/ask-ai-buttons";
import { Prose } from "@/components/primitives/prose";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import * as AlertComponents from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BlockQuote } from "@/components/ui/blockquote";
import { CodeWindow } from "@/components/ui/code-window";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CopyButton } from "@/components/ui/copy-button";
import { FileTree } from "@/components/ui/file-tree";
import { HoverInfo } from "@/components/ui/hover-info";
import { Step, Steps } from "@/components/ui/steps";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { siteConfig } from "@/config/site-config";

// Filter the icon libraries to only include valid React components
function filterForMDXComponents(module: Record<string, any>): MDXComponents {
  return Object.fromEntries(
    Object.entries(module).filter(([_key, value]) => {
      // Only include valid React component types
      return isValidElementType(value);
    })
  );
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Prose id="sk-mdx-wrapper" className="container mx-auto py-10">
    {children}
  </Prose>
);

/** MDX component map for RSC and bundlers — not a React hook despite the legacy name on `useMDXComponents`. */
export function getMDXComponents(components: MDXComponents): MDXComponents {
  return {
    wrapper,

    ...filterForMDXComponents(LucideIcons),
    ...filterForMDXComponents(RadixIcons),

    ...AlertComponents,

    // Tabs
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,

    // Code
    CodeWindow,
    CopyButton,

    // Accordion
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,

    // Badge
    Badge,

    // BlockQuote
    BlockQuote,

    // Collapsible
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,

    // Hover
    HoverInfo,

    // Steps
    Steps,
    Step,

    // Table (shadcn)
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
    TableCaption,

    // Existing
    AskAiButtons,
    Card,
    CardGroup,
    FileTree,
    SecretGenerator,
    SiteName: () => <>{siteConfig.title}</>,
    ...components,
  };
}

/** Legacy name kept for MDX tooling; delegates to {@link getMDXComponents}. */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components);
}
