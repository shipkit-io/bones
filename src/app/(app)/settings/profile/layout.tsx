import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";

export const metadata: Metadata = constructMetadata({
	title: "Profile Settings",
	description: "Update your personal information and how others see you on the platform.",
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
	return children;
}
