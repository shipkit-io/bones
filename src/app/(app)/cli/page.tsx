import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { InstallSection } from "./_components/install-section";

export const metadata: Metadata = constructMetadata({
  title: "Bones CLI: browse and install shadcn/ui registries",
  description:
    "Browse and install shadcn/ui registries without a terminal. Run npx shadcn@latest add https://cli.bones.sh in your Next.js project to get started.",
});

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="container grow">
        <div className="mx-auto max-w-(--breakpoint-sm)">
          <InstallSection />

          <div className="mt-10 space-y-10">
            <p className="text-muted-foreground [&>a]:font-medium [&>a]:text-blue-400 [&>a]:underline">
              Run this command in your Next.js project after setting up{" "}
              <Link href={"https://ui.shadcn.com/docs/"}>ShadCN UI</Link>.
              <br />
              The Next.js starter for Shadcn/UI is{" "}
              <Link href={routes.external.bones}>Shipkit Bones</Link>.
            </p>
            <Link
              href={routes.external.shipkit}
              className={cn(buttonVariants({ variant: "link" }), "px-0")}
            >
              Get more components and ship even faster with Shipkit.
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
