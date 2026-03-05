import { google } from "googleapis";
import type React from "react";

import { env } from "@/env";
import { logger } from "@/lib/logger";
import { SafeHTML } from "./safe-html";

interface Heading {
	id: string;
	text: string;
	level: number;
}

interface ProcessedDocument {
	content: React.ReactNode;
	headings: Heading[];
}

export const importGoogleDoc = async (documentId: string): Promise<ProcessedDocument> => {
	if (!env.NEXT_PUBLIC_FEATURE_GOOGLE_SERVICE_ACCOUNT_ENABLED) {
		logger.warn("Google Service Account feature is disabled. Skipping Google Doc import.");
		return {
			content: <p>Google Docs integration is disabled.</p>,
			headings: [],
		};
	}

	if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
		logger.error("Google Service Account credentials are not set");
		return {
			content: <p>Error: Google credentials missing.</p>,
			headings: [],
		};
	}

	try {
		const auth = new google.auth.GoogleAuth({
			credentials: {
				client_email: env.GOOGLE_CLIENT_EMAIL,
				private_key: env.GOOGLE_PRIVATE_KEY,
			},
			scopes: ["https://www.googleapis.com/auth/documents.readonly"],
		});

		const docs = google.docs({ version: "v1", auth });

		const document = await docs.documents.get({
			documentId,
		});

		return processDocument(document.data);
	} catch (error) {
		logger.error("Error fetching or processing Google Doc:", { documentId, error });
		return {
			content: <p>Error importing Google Doc. Please check logs.</p>,
			headings: [],
		};
	}
};

function processTextRun(textRun: any): string {
	const { content, textStyle } = textRun;
	let text = content;

	// Handle text styling
	if (textStyle) {
		if (textStyle.bold) text = `<strong>${text}</strong>`;
		if (textStyle.italic) text = `<em>${text}</em>`;
		if (textStyle.underline) text = `<u>${text}</u>`;
	}

	return text;
}

function processListItem(paragraph: any, lists: any, content: string): string {
	const listId = paragraph.bullet?.listId;
	const list = lists[listId];
	const nestingLevel = paragraph.bullet?.nestingLevel || 0;
	const listProperties = list.listProperties;

	// Get the correct list style
	const glyphFormat = listProperties?.nestingLevels?.[nestingLevel]?.glyphFormat || "%0.";
	const glyphType = listProperties?.nestingLevels?.[nestingLevel]?.glyphType;

	let listTag = "ul";
	let listStyle = "";

	if (glyphType === "DECIMAL" || glyphFormat.includes("%0")) {
		listTag = "ol";
		// Handle legal numbering format
		if (glyphFormat.includes(".%0")) {
			listStyle = ' style="list-style-type: decimal-leading-zero;"';
		}
	}

	return `<${listTag}${listStyle}><li>${content}</li></${listTag}>`;
}

function processDocument(doc: any): ProcessedDocument {
	const headings: Heading[] = [];
	let content = "";
	const currentList: string | null = null;
	const currentListLevel = 0;

	doc.body.content.forEach((item: any, index: number) => {
		if (item.paragraph) {
			const paragraph = item.paragraph;
			let paragraphContent = "";

			// Process all elements in the paragraph
			for (const element of paragraph.elements) {
				if (element.textRun) {
					paragraphContent += processTextRun(element.textRun);
				}
			}

			// Skip empty paragraphs
			if (!paragraphContent.trim()) return;

			// Handle headings
			if (paragraph.paragraphStyle?.namedStyleType?.includes("HEADING")) {
				const level = Number.parseInt(
					paragraph.paragraphStyle.namedStyleType.replace("HEADING_", "")
				);
				const text = paragraphContent.replace(/<[^>]*>/g, ""); // Strip HTML for heading text
				const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

				headings.push({ id, text, level });
				content += `<h${level} id="${id}">${paragraphContent}</h${level}>\n`;
			}
			// Handle lists
			else if (paragraph.bullet) {
				content += processListItem(paragraph, doc.lists, paragraphContent);
			}
			// Regular paragraphs
			else {
				content += `<p>${paragraphContent}</p>\n`;
			}
		}
	});

	return {
		content: (
			<div className="gdoc-content">
				<SafeHTML html={content} />
			</div>
		),
		headings,
	};
}
