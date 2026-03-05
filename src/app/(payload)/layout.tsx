/**
 * Payload CMS route group layout.
 *
 * When Payload is disabled (no DATABASE_URL / PAYLOAD_SECRET), this layout
 * renders children directly — no @payloadcms packages are imported.
 *
 * When Payload is enabled, the heavy imports (CSS, RootLayout, config) are
 * loaded via a dynamic import of ./payload-root-layout so that Turbopack
 * can tree-shake them out of disabled builds and externalised packages
 * don't blow up on Vercel at runtime.
 */

import { env } from "@/env";
import type React from "react";

interface Args {
	children: React.ReactNode;
}

const Layout = async ({ children }: Args) => {
	if (!env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED) {
		return <>{children}</>;
	}

	const { default: PayloadRootLayout } = await import("./payload-root-layout");
	return <PayloadRootLayout>{children}</PayloadRootLayout>;
};

export default Layout;
