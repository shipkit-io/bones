"use client";

import { ContentHistory } from "@/components/ui/content-history";
import { EditModeController } from "@/components/ui/edit-mode-controller";
import { FloatingEditor } from "@/components/ui/floating-editor";
import { saveContent } from "@/server/actions/content-actions";
import * as React from "react";

interface MDXContentEditorProps {
	raw: string;
	filePath: string;
}

const EDIT_MODE_KEY = "floating-editor-edit-mode";

export function MDXContentEditor({ raw, filePath }: MDXContentEditorProps) {
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
				<FloatingEditor
					content={raw}
					onSave={handleSave}
					isEditModeEnabled={isEditMode}
					isMarkdown
				/>

				<div className="mt-8 rounded-lg border">
					<h2 className="border-b p-4 text-lg font-medium">Content History</h2>
					<ContentHistory filePath={filePath} onRevert={handleSave} />
				</div>
			</div>
		</>
	);
}
