import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";

export const metadata: Metadata = constructMetadata({
	title: "Projects",
	description: "Manage your projects and organize your work. Create, edit, and track progress across all your projects.",
});

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
