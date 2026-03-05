import type { Metadata } from "next";
import { Suspense } from "react";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { constructMetadata } from "@/config/metadata";
import { ToolsSection } from "../_components/tools-section";

export const metadata: Metadata = constructMetadata({
	title: "Developer Tools",
	description: "Access a collection of useful developer tools and utilities for building, testing, and debugging.",
});

export default function ToolsPage() {
	return (
		<div className="flex-1 space-y-8 p-4 pt-0 md:p-8">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Developer Tools</h2>
				<p className="text-muted-foreground">
					A collection of useful tools and utilities for developers.
				</p>
			</div>
			<Suspense fallback={<SuspenseFallback />}>
				<ToolsSection />
			</Suspense>
		</div>
	);
}
