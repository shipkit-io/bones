"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PreviewProps } from "./types";

export function Preview({ component, currentStyle }: PreviewProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center p-4",
        currentStyle === "brutalist" ? "border-2 border-primary" : "rounded-md border"
      )}
    >
      <Card
        className={cn(
          "flex h-full w-full items-center justify-center",
          currentStyle === "brutalist"
            ? "rounded-none border-2 border-primary"
            : "rounded-md border"
        )}
      >
        <div className="text-center text-muted-foreground">
          <p>Preview not available for {component.name}</p>
          <p className="mt-2 text-sm">Component type: {component.type}</p>
        </div>
      </Card>
    </div>
  );
}
