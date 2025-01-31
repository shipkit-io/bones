"use client";

import { ContentHistory } from "@/components/ui/content-history";
import { EditModeController } from "@/components/ui/edit-mode-controller";
import { saveContent } from "@/server/actions/content-actions";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

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
	const contentRef = React.useRef<HTMLDivElement>(null);
	const [isEditMode, setIsEditMode] = React.useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(EDIT_MODE_KEY);
			return stored ? JSON.parse(stored) : false;
		}
		return false;
	});
	const [hasChanges, setHasChanges] = React.useState(false);
	const [isSaving, setIsSaving] = React.useState(false);
	const [saveSuccess, setSaveSuccess] = React.useState(false);
	const saveTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
	const [editingSection, setEditingSection] =
		React.useState<HTMLElement | null>(null);

	// Handle edit mode and section interactions
	React.useEffect(() => {
		if (!contentRef.current) return;

		// Find all editable sections
		const sections = contentRef.current.querySelectorAll(
			"h1, h2, h3, h4, h5, h6, p, ul, ol",
		);

		// Add edit mode styles to sections
		for (const section of sections) {
			const el = section as HTMLElement;

			// Always maintain border space to prevent layout shift
			el.style.border = "2px solid transparent";
			el.style.padding = "2px";
			el.style.borderRadius = "2px";

			if (isEditMode) {
				el.style.cursor = "pointer";
				el.style.transition =
					"border-color 0.15s ease, background-color 0.15s ease";
				el.contentEditable = "true";
				el.style.outline = "none";

				// Handle content changes
				el.addEventListener("input", () => {
					setHasChanges(true);
					setSaveSuccess(false);
					clearTimeout(saveTimeoutRef.current);
				});

				// Handle hover effect
				el.addEventListener("mouseenter", () => {
					if (el !== editingSection) {
						el.style.borderColor = "rgba(147, 51, 234, 0.5)";
					}
				});

				el.addEventListener("mouseleave", () => {
					if (el !== editingSection) {
						el.style.borderColor = "transparent";
					}
				});

				// Handle focus/blur for editing state
				el.addEventListener("focus", () => {
					setEditingSection(el);
					el.style.borderColor = "rgb(147, 51, 234)";
					el.style.background = "rgba(147, 51, 234, 0.05)";
				});

				el.addEventListener("blur", () => {
					setEditingSection(null);
					el.style.borderColor = "transparent";
					el.style.background = "transparent";
				});

				// Prevent default behaviors
				el.addEventListener("keydown", (e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
					}
				});
			}
		}

		return () => {
			// Clean up styles
			for (const section of sections) {
				const el = section as HTMLElement;
				if (isEditMode) {
					el.style.cursor = "";
					el.style.transition = "";
					el.contentEditable = "false";
					el.style.outline = "";
					el.style.background = "";
				}
				// Don't remove border/padding to prevent layout shift when toggling edit mode
			}
		};
	}, [isEditMode, editingSection]);

	// Persist edit mode state
	React.useEffect(() => {
		localStorage.setItem(EDIT_MODE_KEY, JSON.stringify(isEditMode));
	}, [isEditMode]);

	const handleSave = async () => {
		if (!contentRef.current) return;
		setIsSaving(true);

		try {
			const content = Array.from(contentRef.current.children)
				.map((el) => el.textContent)
				.join("\n\n");

			await saveContent(filePath, content, {
				createPR: false,
			});

			setHasChanges(false);
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 2000);
		} catch (error) {
			console.error("Failed to save content:", error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<>
			<EditModeController
				isEnabled={isEditMode}
				onToggle={() => setIsEditMode(!isEditMode)}
			/>

			<div className="relative">
				<div ref={contentRef} className="relative">
					{children}
				</div>

				{/* Floating save button */}
				{isEditMode && hasChanges && (
					<div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
						<Button
							onClick={handleSave}
							disabled={isSaving}
							className={cn(
								"shadow-lg transition-all duration-200",
								saveSuccess && "bg-green-500 hover:bg-green-600",
							)}
						>
							{isSaving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : saveSuccess ? (
								<>
									<Check className="mr-2 h-4 w-4" />
									Saved!
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</div>
				)}

				<div className="mt-8 rounded-lg border">
					<h2 className="border-b p-4 text-lg font-medium">Content History</h2>
					<ContentHistory
						filePath={filePath}
						onRevert={(content) =>
							saveContent(filePath, content, { createPR: false })
						}
					/>
				</div>
			</div>
		</>
	);
}
