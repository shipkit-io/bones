"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { MDXContentEditor } from "./mdx-content-editor";
import { MDXProviderClient } from "./mdx-provider";

interface MDXContentWrapperProps {
	children: ReactNode;
	raw: string;
	filePath: string;
}

export function MDXContentWrapper({
	children,
	raw,
	filePath,
}: MDXContentWrapperProps) {
	const contentRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<HTMLDivElement>(null);

	// Clone the rendered content for the editor
	useEffect(() => {
		if (contentRef.current && editorRef.current) {
			// Clear previous content
			editorRef.current.innerHTML = "";

			// Clone the content
			const clone = contentRef.current.cloneNode(true) as HTMLElement;

			// Add a class to the clone for styling
			clone.classList.add("editor-content");

			// Insert the clone into the editor container
			editorRef.current.appendChild(clone);
		}
	}, []);

	return (
		<MDXProviderClient>
			{/* Original content with ref */}
			<div ref={contentRef} className="mdx-content">
				{children}
			</div>

			{/* Editor with cloned content */}
			<div className="relative">
				<div ref={editorRef} className="editor-container" />
				<MDXContentEditor raw={raw} filePath={filePath} />
			</div>
		</MDXProviderClient>
	);
}
