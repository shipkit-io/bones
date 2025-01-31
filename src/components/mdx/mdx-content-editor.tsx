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
		const styles: HTMLStyleElement[] = [];

		for (const section of sections) {
			const el = section as HTMLElement;

			if (isEditMode) {
				// Make content editable without changing layout
				el.contentEditable = "true";
				el.style.outline = "none";
				el.style.cursor = "pointer";

				// Use pseudo-element for hover/focus indication
				const style = document.createElement("style");
				const className = `editable-${Math.random().toString(36).slice(2)}`;
				el.classList.add(className);

				style.textContent = `
					.${className} {
						position: relative;
					}
					.${className}::before {
						content: '';
						position: absolute;
						inset: -2px;
						border: 2px solid transparent;
						border-radius: 2px;
						pointer-events: none;
						transition: border-color 0.15s ease;
					}
					.${className}:hover::before {
						border-color: rgba(147, 51, 234, 0.5);
					}
					.${className}:focus::before {
						border-color: rgb(147, 51, 234);
					}
				`;
				document.head.appendChild(style);
				styles.push(style);

				// Handle content changes
				el.addEventListener("input", () => {
					setHasChanges(true);
					setSaveSuccess(false);
					clearTimeout(saveTimeoutRef.current);
				});

				// Handle focus/blur for editing state
				el.addEventListener("focus", () => {
					setEditingSection(el);
				});

				el.addEventListener("blur", () => {
					setEditingSection(null);
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
			for (const style of styles) {
				document.head.removeChild(style);
			}

			for (const section of sections) {
				const el = section as HTMLElement;
				if (isEditMode) {
					el.contentEditable = "false";
					el.style.cursor = "";
					el.style.outline = "";
					// Remove all classes that start with 'editable-'
					const editableClass = Array.from(el.classList).find((c) =>
						c.startsWith("editable-"),
					);
					if (editableClass) {
						el.classList.remove(editableClass);
					}
				}
			}
		};
	}, [isEditMode]);

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
