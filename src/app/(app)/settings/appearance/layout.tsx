import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";

export const metadata: Metadata = constructMetadata({
	title: "Appearance Settings",
	description: "Customize the look and feel of the application with theme and display preferences.",
});

export default function AppearanceLayout({ children }: { children: React.ReactNode }) {
	return children;
}
