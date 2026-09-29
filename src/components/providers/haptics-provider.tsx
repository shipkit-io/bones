"use client";

import { useEffect } from "react";
import type { HapticPattern } from "@/hooks/use-haptics";
import { haptic, useHaptics } from "@/hooks/use-haptics";

/**
 * Mounts the web-haptics singleton so the imperative `haptic()` function
 * works from any component (Button, Switch, etc.) without requiring
 * each one to call `useHaptics()`.
 *
 * Also adds event delegation: any element with a `data-haptic` attribute
 * (e.g. Button renders `data-haptic="light"` by default) will fire the
 * appropriate haptic pattern on pointerdown — no `'use client'` required
 * on the element itself.
 *
 * Disabled globally via the `DISABLE_HAPTICS` environment variable.
 *
 * Place once near the root of your app (e.g. in layout.tsx or providers.tsx).
 */
export function HapticsProvider({ children }: { children: React.ReactNode }) {
  // Calling the hook registers the singleton trigger
  useHaptics();

  useEffect(() => {
    // Bail out if haptics are disabled at build time
    if (process.env.NEXT_PUBLIC_FEATURE_HAPTICS_ENABLED === "false") return;

    const handler = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target) return;

      // Only fire for elements that explicitly opt in via data-haptic
      const el = target.closest("[data-haptic]");
      if (!el) return;

      const pattern = el.getAttribute("data-haptic") as HapticPattern | null;
      if (pattern) haptic(pattern);
    };

    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  return <>{children}</>;
}
