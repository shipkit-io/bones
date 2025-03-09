import type { Metadata } from "next";
import type React from "react";

import { RootLayout } from "@/components/layouts/root-layout";
import { metadata as defaultMetadata } from "@/config/metadata";

export const metadata: Metadata = defaultMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
	return <RootLayout>{children}</RootLayout>;
}
