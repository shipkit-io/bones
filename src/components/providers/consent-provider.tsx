import { ConsentManagerDialog, ConsentManagerProvider, CookieBanner } from "@c15t/nextjs";
import type { ReactNode } from "react";
import { env } from "@/env";

export default function ConsentProvider({ children }: { children: ReactNode }) {
	if (!env?.NEXT_PUBLIC_FEATURE_C15T_ENABLED) {
		return children;
	}

	return (
		<ConsentManagerProvider
			options={
				env?.NEXT_PUBLIC_C15T_URL
					? { mode: "c15t", backendURL: env?.NEXT_PUBLIC_C15T_URL }
					: { mode: "offline" }
			}
		>
			{children}
			<CookieBanner />
			<ConsentManagerDialog />
		</ConsentManagerProvider>
	);
}
