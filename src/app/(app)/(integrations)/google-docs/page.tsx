import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";
import { DocLayout } from "./_components/doc-layout";
import { importGoogleDoc } from "./_components/google-docs";

export const metadata: Metadata = constructMetadata({
	title: "Google Docs Integration",
	description: "View content imported from Google Docs.",
	noIndex: true,
});

export default async function DocPage() {
	// Either fetch from Google Docs or use local MDX/Markdown
	const { content, headings } = await importGoogleDoc(
		"1qhd9BN-6995ROtOktxFuMOcFyTzskRnVT1yTNRtJrXA"
	).catch((error) => {
		console.error("Error importing Google Doc:", error);
		return { content: "", headings: [] };
	});

	return <DocLayout toc={headings}>{content}</DocLayout>;
}
