"use client";

import * as React from "react";

interface SafeHTMLProps {
	html: string;
	className?: string;
}

const allowedTags = {
	p: true,
	h1: true,
	h2: true,
	h3: true,
	h4: true,
	h5: true,
	h6: true,
	ul: true,
	ol: true,
	li: true,
	strong: true,
	em: true,
	u: true,
};

export function SafeHTML({ html, className }: SafeHTMLProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!containerRef.current) return;

		const container = containerRef.current;
		const tempDiv = document.createElement("div");
		tempDiv.innerHTML = html;

		// Remove any existing content
		container.innerHTML = "";

		// Process and append only allowed elements
		const processNode = (node: Node): Node | null => {
			if (node.nodeType === Node.TEXT_NODE) {
				return node.cloneNode(true);
			}

			if (node.nodeType === Node.ELEMENT_NODE) {
				const element = node as Element;
				const tagName = element.tagName.toLowerCase();

				if (allowedTags[tagName as keyof typeof allowedTags]) {
					const newElement = document.createElement(tagName);

					// Copy allowed attributes (add more as needed)
					if (element.id) newElement.id = element.id;
					if (element.className) newElement.className = element.className;

					// Process child nodes
					for (const child of element.childNodes) {
						const processedChild = processNode(child);
						if (processedChild) {
							newElement.appendChild(processedChild);
						}
					}

					return newElement;
				}
			}

			return null;
		};

		for (const node of tempDiv.childNodes) {
			const processedNode = processNode(node);
			if (processedNode) {
				container.appendChild(processedNode);
			}
		}
	}, [html]);

	return <div ref={containerRef} className={className} />;
}
