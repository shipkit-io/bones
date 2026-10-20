"use client";

import * as React from "react";
import { type ShortcutActionType, shortcutLabel } from "@/config/keyboard-shortcuts";
import { useIsMac } from "@/hooks/use-is-mac";
import { cn } from "@/lib/utils";

interface ShortcutDisplayProps {
  action: ShortcutActionType;
  className?: string;
  /** Render as a different component, e.g., DropdownMenuShortcut */
  as?: React.ElementType<{ children?: React.ReactNode; className?: string }>;
  /** Base styles to apply, defaults to kbd styles */
  baseClassName?: string;
}

// Default styles mimicking Shadcn kbd
const defaultKbdStyles =
  "h-5 select-none items-center gap-1 rounded-lg border bg-muted px-1.5 font-mono text-[10px] font-medium";

/**
 * The key bound to an action, as a person reads it.
 *
 * This is the only way a shortcut should reach the screen. Anything that
 * hand-writes "⌘S" into markup drifts from the binding or outlives it: the
 * user menus did exactly that, and six of their eight hints named a key
 * nothing was listening for.
 *
 * When an action has more than one binding, `shortcutConfig` order decides
 * which is shown, so list the one you want advertised first (mod+K before
 * "/" for search). Formatting itself is pure and lives in the config module.
 */
export const ShortcutDisplay = ({
  action,
  className,
  as: Component = "kbd", // Default to HTML kbd tag
  baseClassName = defaultKbdStyles,
}: ShortcutDisplayProps) => {
  const isMac = useIsMac();
  const label = shortcutLabel(action, isMac);

  // No binding means nothing to advertise. Rendering an empty element here
  // would put a stray box in a menu row.
  if (!label) return null;

  const finalClassName =
    Component === "kbd" ? cn("inline-flex", baseClassName, className) : className;

  return <Component className={finalClassName}>{label}</Component>;
};

ShortcutDisplay.displayName = "ShortcutDisplay";

interface ShortcutSlotProps {
  action: ShortcutActionType;
  /** Styles for the slot itself, e.g. where it sits in a flex row. */
  className?: string;
}

/**
 * A shortcut hint that holds its own space.
 *
 * The platform is only knowable after hydration, so the server spells mod+K
 * "Ctrl+K" where a Mac spells it "⌘K" -- 57px against 28px in the same font.
 * A hint that sizes itself spends that difference on whatever contains it: in
 * the header search button it grew the control 34px on a Mac and 63px on
 * Windows at hydration, and the Windows case pushed two nav links into "More"
 * a second after the page had already drawn them (LAC-5000).
 *
 * So the slot is sized by whichever spelling is wider, read from the config
 * rather than hand-written, and the hint is pinned inside it and faded in once
 * the platform is known. The layout around it is the same in the first frame as
 * it is after hydration, and the hint never changes width in view.
 */
export const ShortcutSlot = ({ action, className }: ShortcutSlotProps) => {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Both spellings, widest first. Mono digits and letters are one width each,
  // so the longer string is the wider one.
  const widest = [shortcutLabel(action, true), shortcutLabel(action, false)]
    .filter((label): label is string => Boolean(label))
    .sort((a, b) => b.length - a.length)[0];

  if (!widest) return null;

  return (
    <span className={cn("pointer-events-none relative inline-flex shrink-0", className)}>
      {/* A spacer, not a key: it holds the widest spelling's width and is
          hidden from assistive tech so the hint is announced once. */}
      <span aria-hidden="true" className={cn("invisible inline-flex", defaultKbdStyles)}>
        {widest}
      </span>
      <ShortcutDisplay
        action={action}
        className={cn(
          "absolute top-0 right-0 transition-opacity duration-300",
          isClient ? "opacity-100" : "opacity-0"
        )}
      />
    </span>
  );
};

ShortcutSlot.displayName = "ShortcutSlot";
