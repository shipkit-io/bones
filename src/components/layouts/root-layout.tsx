import "@/styles/globals.css";

import { GeistSans as fontSans } from "geist/font/sans";
import { Noto_Serif_Display as FontSerif } from "next/font/google";
// import localFont from "next/font/local";

import { Analytics } from "@/components/primitives/analytics";
import { ErrorToast } from "@/components/primitives/error-toast";
import { WebVitals } from "@/components/primitives/web-vitals";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/react";
import HolyLoader from "holy-loader";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ViewTransitions } from "next-view-transitions";
import { type ReactNode, Suspense } from "react";

const fontSerif = FontSerif({
	weight: ["400", "500", "600", "700"],
	style: ["normal", "italic"],
	subsets: ["latin"],
	variable: "--font-serif",
});

// const fontSud = localFont({
// 	src: "../../fonts/sud.woff2",
// 	display: "swap",
// 	variable: "--font-sud",
// });

export function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<ViewTransitions>
			<html lang="en" suppressHydrationWarning>
				<body
					className={cn(
						"min-h-screen antialiased",
						"font-sans font-normal leading-relaxed",
						fontSans.variable,
						fontSerif.variable,
					)}
				>
					<HolyLoader
						showSpinner
						height={'3px'}
						color={"linear-gradient(90deg, #FF61D8, #8C52FF, #5CE1E6, #FF61D8)"}
					/>
					<SessionProvider>
						<TRPCReactProvider>
							<ThemeProvider attribute="class" defaultTheme="dark">
								<TooltipProvider delayDuration={100}>
									{children}

									{/* Metrics */}
									<Analytics />
									<WebVitals />

									{/* Toasts */}
									<Toaster />
									<SonnerToaster />
									<Suspense>
										<ErrorToast />
									</Suspense>
								</TooltipProvider>
							</ThemeProvider>
						</TRPCReactProvider>
					</SessionProvider>
				</body>
			</html>
		</ViewTransitions>
	);
}
