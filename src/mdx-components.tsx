import * as RadixIcons from "@radix-ui/react-icons";
import * as LucideIcons from "lucide-react";
import type { MDXComponents } from "mdx/types";
import { isValidElementType } from "react-is";
import { Card } from "@/components/mdx/card";
import { CardGroup } from "@/components/mdx/card-group";
import * as AlertComponents from "@/components/ui/alert";
import { siteConfig } from "@/config/site-config";

// Filter the icon libraries to only include valid React components
function filterForMDXComponents(module: Record<string, any>): MDXComponents {
  return Object.fromEntries(
    Object.entries(module).filter(([key, value]) => {
      // Only include valid React component types
      return isValidElementType(value);
    }),
  ) as MDXComponents;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <div id="sk-mdx-wrapper" className="prose container mx-auto py-10">
    {children}
  </div>
);

export function useMDXComponents(components: MDXComponents): MDXComponents {
  // const fumadocsComponents = await import('fumadocs-ui/mdx');

  return {
    wrapper,
    // ...filterForMDXComponents(fumadocsComponents),

    ...filterForMDXComponents(LucideIcons),
    ...filterForMDXComponents(RadixIcons),

    ...AlertComponents,
    Card,
    CardGroup,
    SiteName: () => <>{siteConfig.title}</>,
    ...components,
  };
}
