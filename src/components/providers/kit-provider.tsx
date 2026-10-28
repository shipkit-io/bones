import { ErrorToast } from "@/components/primitives/error-toast";
import { JsonLd } from "@/components/primitives/json-ld";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { HapticsProvider } from "@/components/providers/haptics-provider";
import { KeyboardShortcutProvider } from "@/components/providers/keyboard-shortcut-provider";
import { ThemeProvider as ShipkitThemeProvider } from "@/components/ui/shipkit/theme";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/lib/trpc/react";
// import ConsentProvider from "@/components/providers/consent-provider";

import HolyLoader from "holy-loader";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { ComponentProps, ReactNode } from "react";
import { Suspense } from "react";
import { FontProvider } from "@/components/providers/font-provider";
import { isAuthenticationAvailable } from "@/lib/auth/auth-strategy";

import "@/styles/globals.css";

interface KitProviderProps {
  children: ReactNode;
  /**
   * Session data for Next Auth
   */
  session?: Session | null;
  /**
   * Page props for TRPC
   */
  pageProps?: Record<string, unknown>;
}

/**
 * Main provider component that wraps all providers used in the application
 * Can be used in both App Router and Pages Router
 */
export function KitProvider({ children, session, pageProps }: KitProviderProps) {
  const authEnabled = isAuthenticationAvailable();
  const sessionProviderProps: Omit<ComponentProps<typeof SessionProvider>, "children"> = authEnabled
    ? { session }
    : {
        /*
         * Auth is off: hand SessionProvider a null session and stop every
         * refetch, so it never calls /api/auth/session. `refetchOnMount` used
         * to be in this list behind an `as any`; it is a react-query option,
         * not a next-auth one, and SessionProvider has never read it.
         */
        session: null,
        refetchOnWindowFocus: false,
        refetchInterval: 0,
        refetchWhenOffline: false,
      };

  return (
    <>
      <JsonLd organization website />
      <HolyLoader showSpinner height={"4px"} color={"var(--loader-color)"} />
      <ShipkitThemeProvider>
        <SessionProvider {...sessionProviderProps}>
          <TRPCReactProvider {...pageProps}>
            <TooltipProvider delayDuration={100}>
              <AnalyticsProvider>
                {/* <ConsentProvider> */}

                <HapticsProvider>
                  <KeyboardShortcutProvider>
                    <FontProvider>
                      {/* Content */}
                      {children}

                      {/* Toast - Display messages to the user */}
                      <Toaster />

                      {/* Error Toast - Display error messages to the user based on search params */}
                      <Suspense>
                        <ErrorToast />
                      </Suspense>
                    </FontProvider>
                  </KeyboardShortcutProvider>
                </HapticsProvider>
                {/* </ConsentProvider> */}
              </AnalyticsProvider>
            </TooltipProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </ShipkitThemeProvider>
    </>
  );
}
