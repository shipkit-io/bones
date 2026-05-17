import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
