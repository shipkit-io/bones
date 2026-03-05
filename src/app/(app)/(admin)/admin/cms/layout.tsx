import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";

export const metadata: Metadata = constructMetadata({
	title: "CMS Management",
	description: "Manage your Payload CMS configuration and seed data.",
	noIndex: true,
});

export default function CMSLayout({ children }: { children: React.ReactNode }) {
	return children;
}
