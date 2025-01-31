"use client";

import * as React from "react";
import { MDXProvider } from "@mdx-js/react";
import { Card } from "@/components/mdx/card";
import { CardGroup } from "@/components/mdx/card-group";

const components = {
	h1: ({ children }) => <h1 className="mb-4 text-4xl font-bold">{children}</h1>,
	h2: ({ children }) => <h2 className="mb-3 text-3xl font-bold">{children}</h2>,
	h3: ({ children }) => <h3 className="mb-2 text-2xl font-bold">{children}</h3>,
	p: ({ children }) => <p className="mb-4">{children}</p>,
	ul: ({ children }) => <ul className="mb-4 list-disc pl-6">{children}</ul>,
	ol: ({ children }) => <ol className="mb-4 list-decimal pl-6">{children}</ol>,
	li: ({ children }) => <li className="mb-1">{children}</li>,
	a: ({ href, children }) => (
		<a href={href} className="text-blue-500 underline hover:text-blue-700">
			{children}
		</a>
	),
	blockquote: ({ children }) => (
		<blockquote className="mb-4 border-l-4 border-gray-200 pl-4 italic">
			{children}
		</blockquote>
	),
	Card,
	CardGroup,
};

export function MDXProviderClient({ children }: { children: React.ReactNode }) {
	return <MDXProvider components={components}>{children}</MDXProvider>;
}
