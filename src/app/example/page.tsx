"use client";

import { FloatingEditor } from "@/components/ui/floating-editor";
import { EditModeController } from "@/components/ui/edit-mode-controller";
import { ContentHistory } from "@/components/ui/content-history";
import { readContent, saveContent } from "@/server/actions/content-actions";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Storage keys
const EDIT_MODE_KEY = "floating-editor-edit-mode";

// Source file paths
const EXAMPLE_FILE = "app/example/content/example.mdx";
const MARKDOWN_FILE = "app/example/content/markdown.mdx";

export default function ExamplePage() {
	const [isEditMode, setIsEditMode] = useState(() => {
		// Initialize from localStorage if available
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(EDIT_MODE_KEY);
			return stored ? JSON.parse(stored) : false;
		}
		return false;
	});

	const [content, setContent] = useState<string>("");
	const [markdownContent, setMarkdownContent] = useState<string>("");

	// Persist edit mode state
	useEffect(() => {
		localStorage.setItem(EDIT_MODE_KEY, JSON.stringify(isEditMode));
	}, [isEditMode]);

	// Load content
	useEffect(() => {
		async function loadContent() {
			try {
				const [exampleContent, mdContent] = await Promise.all([
					readContent(EXAMPLE_FILE),
					readContent(MARKDOWN_FILE),
				]);

				setContent(
					exampleContent || "# Example Content\n\nStart editing this content!",
				);
				setMarkdownContent(
					mdContent ||
						"# Markdown Content\n\nThis is a **markdown** example with _formatting_.",
				);
			} catch (error) {
				console.error("Failed to load content:", error);
			}
		}

		loadContent();
	}, []);

	const handleSave = async (
		filePath: string,
		newContent: string,
		oldContent: string,
	) => {
		try {
			// Only create a PR if the changes are significant
			const isSignificantChange =
				!oldContent || // New content
				Math.abs(newContent.length - oldContent.length) > 50 || // Large size change
				newContent.split("\n").length !== oldContent.split("\n").length; // Line count change

			await saveContent(filePath, newContent, {
				createPR: isSignificantChange,
				prTitle: isSignificantChange
					? `Content update: ${filePath}`
					: undefined,
				prBody: isSignificantChange
					? "This PR contains significant content changes that should be reviewed."
					: undefined,
			});
		} catch (error) {
			console.error("Failed to save content:", error);
			throw error;
		}
	};

	return (
		<>
			<EditModeController
				isEnabled={isEditMode}
				onToggle={() => setIsEditMode(!isEditMode)}
			/>

			<div className="container mx-auto py-8">
				<h1 className="mb-8 text-4xl font-bold">Floating Editor Example</h1>

				<div className="space-y-8">
					<Tabs defaultValue="example">
						<TabsList>
							<TabsTrigger value="example">Example Content</TabsTrigger>
							<TabsTrigger value="markdown">Markdown Content</TabsTrigger>
						</TabsList>

						<TabsContent value="example" className="space-y-4">
							<div className="rounded-lg border p-6">
								<h2 className="mb-4 text-2xl font-semibold">Example Content</h2>
								<FloatingEditor
									content={content}
									onSave={async (newContent) => {
										await handleSave(EXAMPLE_FILE, newContent, content);
										setContent(newContent);
									}}
									className="max-w-2xl"
									isEditModeEnabled={isEditMode}
									isMarkdown
								/>
							</div>

							<div className="rounded-lg border">
								<h2 className="border-b p-4 text-lg font-medium">
									Content History
								</h2>
								<ContentHistory filePath={EXAMPLE_FILE} onRevert={setContent} />
							</div>
						</TabsContent>

						<TabsContent value="markdown" className="space-y-4">
							<div className="rounded-lg border p-6">
								<h2 className="mb-4 text-2xl font-semibold">
									Markdown Content
								</h2>
								<FloatingEditor
									content={markdownContent}
									onSave={async (newContent) => {
										await handleSave(
											MARKDOWN_FILE,
											newContent,
											markdownContent,
										);
										setMarkdownContent(newContent);
									}}
									isMarkdown
									className="max-w-2xl"
									isEditModeEnabled={isEditMode}
								/>
							</div>

							<div className="rounded-lg border">
								<h2 className="border-b p-4 text-lg font-medium">
									Content History
								</h2>
								<ContentHistory
									filePath={MARKDOWN_FILE}
									onRevert={setMarkdownContent}
								/>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</>
	);
}
