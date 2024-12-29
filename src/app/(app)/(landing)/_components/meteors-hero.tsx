"use client";

import Meteors from "@/components/ui/meteors";
import { cn } from "@/lib/utils";

export function MeteorsHero({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative w-full overflow-hidden bg-background", className)}
    >
      {children}
      <Meteors number={5} />
    </div>
  );
}
