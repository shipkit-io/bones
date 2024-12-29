import { Card } from '@/components/mdx/card';
import { CardGroup } from '@/components/mdx/card-group';
import fumadocsComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		...fumadocsComponents,
		...components,
		Card,
		CardGroup,
	}
}
