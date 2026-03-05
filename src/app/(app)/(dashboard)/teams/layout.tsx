import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";

export const metadata: Metadata = constructMetadata({
	title: "Teams",
	description: "Manage your teams and collaborate with others. Create, edit, and organize teams for your projects.",
});

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
