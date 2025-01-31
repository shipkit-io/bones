"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { MDXContentEditor } from "./mdx-content-editor";
import { MDXProviderClient } from "./mdx-provider";

interface MDXContentWrapperProps {
	children: ReactNode;
	raw: string;
	filePath: string;
	className?: string;
}

export function MDXContentWrapper({
	className,
	children,
	raw,
	filePath,
}: MDXContentWrapperProps) {
	return (
		<MDXProviderClient>
			{/* Editor with MDX content */}
			<div className={className}>
				<MDXContentEditor raw={raw} filePath={filePath}>
					{children}
				</MDXContentEditor>
			</div>
		</MDXProviderClient>
	);
}
