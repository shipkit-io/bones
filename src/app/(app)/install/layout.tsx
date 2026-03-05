import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";

export const metadata: Metadata = constructMetadata({
	title: "Install shadcn/ui Components",
	description: "Add beautiful, accessible UI components to your Next.js application with the shadcn/ui installer.",
});

export default function InstallLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<main className="flex-1">{children}</main>
		</div>
	);
}
