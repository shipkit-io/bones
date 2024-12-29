import type { Config } from "@/payload-types";
import { getPayloadCollection } from "./get-payload-collection";

type Collections = Config["collections"];
type CollectionKey = keyof Collections;

type PayloadRichText = {
	[key: string]: unknown;
	root: {
		type: string;
		children: {
			[key: string]: unknown;
			type: string;
			version: number;
			children?: { text: string }[];
		}[];
		direction: "ltr" | "rtl" | null;
		format: "" | "left" | "start" | "center" | "right" | "end" | "justify";
		indent: number;
		version: number;
	};
};

/**
 * Check if a value is a Payload rich text field
 */
const isRichTextField = (value: unknown): value is PayloadRichText => {
	if (!value || typeof value !== "object") return false;
	const obj = value as Record<string, unknown>;
	return (
		"root" in obj &&
		typeof obj.root === "object" &&
		obj.root !== null &&
		"children" in obj.root &&
		Array.isArray(obj.root.children)
	);
};

/**
 * Extract text content from a rich text field
 */
const extractRichText = (richText: PayloadRichText): string => {
	try {
		return (
			richText?.root?.children
				.map((child) => {
					const textNode = child?.children?.[0];
					return textNode?.text || "";
				})
				.join("\n") || ""
		);
	} catch (error) {
		console.error("Error extracting rich text:", error);
		return "";
	}
};

/**
 * Recursively process an object to convert rich text fields to plain text
 */
const processContent = <T>(content: T): T => {
	if (Array.isArray(content)) {
		return content.map((item) => processContent(item)) as T;
	}

	if (content && typeof content === "object") {
		const processed: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(content)) {
			if (isRichTextField(value)) {
				processed[key] = extractRichText(value);
			} else if (typeof value === "object" && value !== null) {
				const processedValue = processContent(value);
				processed[key] = isRichTextField(processedValue)
					? extractRichText(processedValue)
					: processedValue;
			} else {
				processed[key] = value;
			}
		}

		return processed as T;
	}

	return content;
};

/**
 * Helper function to fetch content from Payload CMS with fallback to static content
 * Automatically converts rich text fields to plain text
 * @param collection - The collection to fetch from
 * @param options - Options for the collection query
 * @param fallbackImport - Function that imports the static content
 * @returns The content from Payload or the static fallback, with rich text converted to plain text
 */
export async function getPayloadContent<T extends CollectionKey, F>({
	collection,
	options = {},
	fallbackImport,
}: {
	collection: T;
	options?: Parameters<typeof getPayloadCollection>[1];
	fallbackImport: () => Promise<{ content: F }>;
}): Promise<Collections[T][] | F> {
	try {
		// Attempt to fetch from Payload
		const payloadContent = await getPayloadCollection(collection, options).catch(
			async (error) => {
				console.warn(
					`Error fetching ${collection} from payload, falling back to static content: `,
					error,
				);
				return null;
			},
		);

		// If Payload fetch successful, process and return the content
		if (payloadContent) {
			return processContent(payloadContent);
		}

		// Otherwise, try to load static content
		const { content } = await fallbackImport();
		return processContent(content);
	} catch (error) {
		console.error(`Error fetching content for ${collection}:`, error);
		throw error; // Let the component handle the error
	}
}
