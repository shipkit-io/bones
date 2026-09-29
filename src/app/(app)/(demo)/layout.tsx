import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Demo",
  description: "Explore component demos and examples showcasing various UI patterns and features.",
  noIndex: true,
});

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-grid border-b bg-muted/30">
        <div className="container-wrapper">
          <div className="container flex items-center gap-4 py-3">
            <Link
              href={routes.app.dashboard}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5 text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
