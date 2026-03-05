import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";

export const metadata: Metadata = constructMetadata({
	title: "Connect GitHub",
	description: "Connect your GitHub account to access repository features and collaborate on projects.",
	noIndex: true,
});

export default function GitHubConnectLayout({ children }: { children: React.ReactNode }) {
	return children;
}
