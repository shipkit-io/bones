import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ProseProps extends HTMLAttributes<HTMLDivElement> {
  unstyled?: boolean;
}

export function Prose({ children, className, unstyled, ...props }: ProseProps) {
  return (
    <div
      className={cn(!unstyled && "prose prose-slate dark:prose-invert", className)}
      {...props}
    >
      {children}
    </div>
  );
}
