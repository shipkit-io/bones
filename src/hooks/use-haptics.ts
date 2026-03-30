"use client";

/**
 * Web Haptics hook for ShipKit.
 *
 * Uses the `web-haptics` library which provides:
 * - `navigator.vibrate()` on Android/Chrome
 * - iOS Safari haptics via the `<input type="checkbox" switch>` trick
 * - PWM intensity modulation for perceived vibration strength
 * - Audio debug mode for desktop testing
 *
 * @see https://haptics.lochie.me
 * @see https://github.com/lochie/web-haptics
 */

import { useMemo } from "react";
import type { HapticInput, TriggerOptions } from "web-haptics";
import { useWebHaptics } from "web-haptics/react";

export type HapticPattern =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection"
  | "soft"
  | "rigid"
  | "nudge"
  | "buzz";

// Mutable store for imperative (non-hook) usage — object properties satisfy react-hooks/globals (no top-level `let` reassignment).
const imperativeHaptics: {
  trigger: ((input?: HapticInput, opts?: TriggerOptions) => void) | null;
  cancel: (() => void) | null;
} = { trigger: null, cancel: null };

/**
 * Fire a haptic vibration pattern.
 *
 * Safe to call unconditionally — no-ops during SSR and on
 * unsupported devices.
 */
export function haptic(pattern: HapticPattern = "light"): void {
  imperativeHaptics.trigger?.(pattern);
}

/**
 * Cancel any ongoing haptic vibration.
 */
export function hapticCancel(): void {
  imperativeHaptics.cancel?.();
}

/**
 * React hook that returns memoised haptic helpers.
 *
 * Uses `web-haptics` under the hood for cross-platform support
 * (including iOS Safari via the checkbox switch trick).
 *
 * ```tsx
 * const { tap, toggle, success } = useHaptics();
 * <Button onClick={() => { tap(); doStuff(); }} />
 * ```
 */
export function useHaptics() {
  const { trigger, cancel, isSupported } = useWebHaptics();

  imperativeHaptics.trigger = trigger;
  imperativeHaptics.cancel = cancel;

  return useMemo(
    () => ({
      /** Light tap — general button presses */
      tap: () => trigger("light"),
      /** Medium pulse — switches, toggles */
      toggle: () => trigger("medium"),
      /** Selection tick — tabs, radio, checkbox */
      selection: () => trigger("selection"),
      /** Double-pulse — copy, save, success */
      success: () => trigger("success"),
      /** Warning burst */
      warning: () => trigger("warning"),
      /** Error buzz */
      error: () => trigger("error"),
      /** Heavy thud — destructive / confirm */
      heavy: () => trigger("heavy"),
      /** Soft cushioned tap */
      soft: () => trigger("soft"),
      /** Hard crisp tap */
      rigid: () => trigger("rigid"),
      /** Reminder nudge */
      nudge: () => trigger("nudge"),
      /** Long buzz */
      buzz: () => trigger("buzz"),
      /** Cancel current vibration */
      cancel,
      /** Whether the device supports haptics */
      isSupported,
      /** Raw trigger — pass any HapticInput */
      trigger,
      /** Legacy pattern access (calls trigger internally) */
      haptic,
    }),
    [trigger, cancel, isSupported]
  );
}
