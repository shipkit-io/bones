import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";

export const metadata: Metadata = constructMetadata({
	title: "Demo",
	description: "Explore component demos and examples showcasing various UI patterns and features.",
	noIndex: true,
});

export default function DemoLayout({ children }: { children: React.ReactNode }) {
	return children;
}
