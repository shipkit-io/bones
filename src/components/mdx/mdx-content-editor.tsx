"use client";

import { ContentHistory } from "@/components/ui/content-history";
import { EditModeController } from "@/components/ui/edit-mode-controller";
import { FloatingEditor } from "@/components/ui/floating-editor";
import { saveContent } from "@/server/actions/content-actions";
import * as React from "react";
import { cn } from "@/lib/utils";

interface MDXContentEditorProps {
	raw: string;
	filePath: string;
	children: React.ReactNode;
}

const EDIT_MODE_KEY = "floating-editor-edit-mode";

export function MDXContentEditor({
	raw,
	filePath,
	children,
}: MDXContentEditorProps) {
	const [isEditMode, setIsEditMode] = React.useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(EDIT_MODE_KEY);
			return stored ? JSON.parse(stored) : false;
		}
		return false;
	});

	// Effect to toggle visibility of original content
	React.useEffect(() => {
		const editorContent = document.querySelector(".editor-content");
		const mdxContent = document.querySelector(".mdx-content");

		if (editorContent && mdxContent) {
			if (isEditMode) {
				editorContent.classList.remove("hidden");
				mdxContent.classList.add("hidden");
			} else {
				editorContent.classList.add("hidden");
				mdxContent.classList.remove("hidden");
			}
		}
	}, [isEditMode]);

	// Persist edit mode state
	React.useEffect(() => {
		localStorage.setItem(EDIT_MODE_KEY, JSON.stringify(isEditMode));
	}, [isEditMode]);

	const handleSave = async (newContent: string) => {
		const isSignificantChange =
			Math.abs(newContent.length - raw.length) > 50 ||
			newContent.split("\n").length !== raw.split("\n").length;

		await saveContent(filePath, newContent, {
			createPR: isSignificantChange,
			prTitle: isSignificantChange ? `Content update: ${filePath}` : undefined,
			prBody: isSignificantChange
				? "This PR contains significant content changes that should be reviewed."
				: undefined,
		});
	};

	return (
		<>
			<EditModeController
				isEnabled={isEditMode}
				onToggle={() => setIsEditMode(!isEditMode)}
			/>

			<div className="relative">
				{/* Original MDX content */}
				<div
					className={cn(
						"mdx-content transition-opacity duration-200",
						isEditMode && "pointer-events-none opacity-0",
					)}
				>
					{children}
				</div>

				{/* Floating editor */}
				<div
					className={cn(
						"absolute inset-0 transition-opacity duration-200",
						!isEditMode && "pointer-events-none opacity-0",
					)}
				>
					<FloatingEditor
						content={raw}
						onSave={handleSave}
						isEditModeEnabled={isEditMode}
						isMarkdown
					/>
				</div>

				<div className="mt-8 rounded-lg border">
					<h2 className="border-b p-4 text-lg font-medium">Content History</h2>
					<ContentHistory filePath={filePath} onRevert={handleSave} />
				</div>
			</div>
		</>
	);
}
