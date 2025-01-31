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
	return (
		<MDXProviderClient>
			{/* Editor with MDX content */}
			<div className="relative">
				<MDXContentEditor raw={raw} filePath={filePath}>
					{children}
				</MDXContentEditor>
			</div>
		</MDXProviderClient>
	);
}
