import { Analytics } from "@/components/primitives/analytics";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ViewTransitions } from "next-view-transitions";
import {
  Space_Grotesk as FontSans,
  Noto_Serif as FontSerif,
} from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

import "@/styles/globals.css";

const fontSerif = FontSerif({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontSans = FontSans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
});

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta charSet="utf-8" />
        </head>
        <body
          className={cn(
            "min-h-screen antialiased",
            "font-sans font-normal leading-relaxed",
            fontSans.variable,
            fontSerif.variable
          )}
        >
          <SessionProvider>
            <TRPCReactProvider>
              <NuqsAdapter>
                <ThemeProvider attribute="class" defaultTheme="dark">
                  <TooltipProvider delayDuration={100}>
                    {/* Content */}
                    {children}

                    {/* Toast - Display messages to the user */}
                    <SonnerToaster />

                    {/* Analytics */}
                    <Analytics />
                  </TooltipProvider>
                </ThemeProvider>
              </NuqsAdapter>
            </TRPCReactProvider>
          </SessionProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
