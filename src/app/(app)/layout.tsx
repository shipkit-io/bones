import type { Metadata, Viewport } from "next";
import React, { Suspense } from "react";

import { AppRouterLayout } from "@/components/layouts/app-router-layout";
import {
  headLinkHints,
  type HeadLinkHint,
  metadata as defaultMetadata,
  viewport as sharedViewport,
} from "@/config/metadata";
import { fontSans, fontSerif } from "@/config/fonts";
import { initializePaymentProviders } from "@/server/providers";
import { FontSelector } from "@/components/modules/devtools/font-selector";
import { env } from "@/env";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { BrickMarquee } from "@/components/blocks/brick-marquee";

export const fetchCache = "default-cache";
export const metadata: Metadata = defaultMetadata;
export const viewport: Viewport = sharedViewport;

await initializePaymentProviders();

export default async function Layout({
  children,
  ...slots
}: {
  children: React.ReactNode;
  [key: string]: React.ReactNode;
}) {
  // Intercepting routes
  const resolvedSlots = (
    await Promise.all(
      Object.entries(slots).map(async ([key, slot]) => {
        const resolvedSlot = slot instanceof Promise ? await slot : slot;
        if (
          !resolvedSlot ||
          (typeof resolvedSlot === "object" &&
            Object.keys(resolvedSlot).length === 0)
        ) {
          return null;
        }
        return [key, resolvedSlot] as [string, React.ReactNode];
      }),
    )
  ).filter((item): item is [string, React.ReactNode] => item !== null);

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {headLinkHints.map((l: HeadLinkHint) => (
          <link
            key={`${l.rel}-${l.href}`}
            rel={l.rel}
            href={l.href}
            crossOrigin={l.crossOrigin}
          />
        ))}

        {env.NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED && (
          <script
            async
            defer
            crossOrigin="anonymous"
            src="https://tweakcn.com/live-preview.min.js"
          />
        )}
      </head>
      {/* Ensure portaled UI (e.g. Radix primitives) inherits the sans-serif family */}
      <body
        className={`${fontSans.variable} ${fontSerif.variable} min-h-screen antialiased font-sans`}
      >
        <AppRouterLayout>
          <main>{children}</main>

          {/* Dynamically render all available slots */}
          {resolvedSlots.map(([key, slot]) => (
            <Suspense key={`slot-${key}`} fallback={<SuspenseFallback />}>
              {slot}
            </Suspense>
          ))}

          {/* TODO: Uncomment this when we have this working */}
          {/* Lacy Morrow vanity plate */}
          {/*<BrickMarquee />*/}
        </AppRouterLayout>

        {/* Add FontSelector only in development */}
        {/*{process.env.NODE_ENV === "development" &&
					env.NEXT_PUBLIC_FEATURE_DEVTOOLS_FONT_SELECTOR_ENABLED && (
						<React.Suspense fallback={null}>
							<FontSelector />
						</React.Suspense>
					)}*/}
      </body>
    </html>
  );
}
