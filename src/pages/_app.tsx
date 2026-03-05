import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import { KitProvider } from "@/components/providers/kit-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { env } from "@/env";

const TailwindIndicator = dynamic(
	() => import("@/components/modules/devtools/tailwind-indicator").then((m) => m.TailwindIndicator),
	{ ssr: false, loading: () => null },
);
const FontSelector = dynamic(
	() => import("@/components/modules/devtools/font-selector").then((m) => m.FontSelector),
	{ ssr: false, loading: () => null },
);

export default function PagesApp({ Component, pageProps }: AppProps) {
	const devtoolsEnabled = env.NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED;
	return (
		<KitProvider session={pageProps.session} pageProps={pageProps}>
			<NuqsAdapter>
				<TeamProvider initialTeams={[{ id: "personal", name: "Personal" }]}>
					<Component {...pageProps} />
					{process.env.NODE_ENV === "development" && devtoolsEnabled && (
						<>
							<TailwindIndicator />
							<FontSelector />
						</>
					)}
				</TeamProvider>
			</NuqsAdapter>
		</KitProvider>
	);
}
