import type { Metadata } from "next";
import { Suspense } from "react";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { FileBrowser } from "./_components/file-browser";

export const metadata: Metadata = {
	title: "File Browser | Project Explorer",
	description: "Browse through project files and directories",
};

export default function BrowserPage() {
	return (
		<div className="container py-10">
			<h1 className="text-4xl font-bold mb-8">Bones Project Explorer</h1>
			<Suspense fallback={<SuspenseFallback />}>
				<FileBrowser />
			</Suspense>
		</div>
	);
}
