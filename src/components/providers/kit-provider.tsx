import { ErrorToast } from "@/components/primitives/error-toast";
import { JsonLd } from "@/components/primitives/json-ld";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { KeyboardShortcutProvider } from "@/components/providers/keyboard-shortcut-provider";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as LegacyToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { ThemeProvider as ShipkitThemeProvider } from "@/components/ui/shipkit/theme";
// import ConsentProvider from "@/components/providers/consent-provider";

import HolyLoader from "holy-loader";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { isAuthenticationAvailable } from "@/lib/auth/auth-strategy";
import { FontProvider } from "@/components/providers/font-provider";

import "@/styles/globals.css";

interface KitProviderProps {
	children: ReactNode;
	/**
	 * Session data for Next Auth
	 */
	session?: any;
	/**
	 * Page props for TRPC
	 */
	pageProps?: any;
}

/**
 * Main provider component that wraps all providers used in the application
 * Can be used in both App Router and Pages Router
 */
export function KitProvider({ children, session, pageProps }: KitProviderProps) {
	const authEnabled = isAuthenticationAvailable();
	const sessionProviderProps = authEnabled
		? { session }
		: {
			session: null,
			refetchOnWindowFocus: false,
			refetchInterval: 0,
			refetchWhenOffline: false,
			refetchOnMount: false,
		};

	return (
		<>
			<JsonLd organization website />
			<HolyLoader
				showSpinner
				height={"4px"}
				color={"linear-gradient(90deg, #FF61D8, #8C52FF, #5CE1E6, #FF61D8)"}
			/>
			<ShipkitThemeProvider>
				<SessionProvider {...(sessionProviderProps as any)}>
					<TRPCReactProvider {...pageProps}>
						<TooltipProvider delayDuration={100}>
							<AnalyticsProvider>
								{/* <ConsentProvider> */}

								<KeyboardShortcutProvider>
									<FontProvider>
										{/* Content */}
										{children}

										{/* Toast - Display messages to the user */}
										<Toaster />

										<LegacyToaster />

										{/* Error Toast - Display error messages to the user based on search params */}
										<Suspense>
											<ErrorToast />
										</Suspense>
									</FontProvider>
								</KeyboardShortcutProvider>
								{/* </ConsentProvider> */}
							</AnalyticsProvider>
						</TooltipProvider>
					</TRPCReactProvider>
				</SessionProvider>
			</ShipkitThemeProvider>
		</>
	);
}
