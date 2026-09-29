/**
 * Font Provider
 *
 * This provider is used to provide the font to the application.
 */

import type { HTMLAttributes } from "react";
import { fontSans, fontSerif } from "@/config/fonts";
import { cn } from "@/lib/utils";

type FontProviderProps = HTMLAttributes<HTMLDivElement>;

export function FontProvider({ children, className, ...props }: FontProviderProps) {
  return (
    <div
      className={cn(
        "mx-auto block w-full",
        "antialiased",
        "font-sans leading-relaxed font-normal",
        fontSans.variable,
        fontSerif.variable,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
