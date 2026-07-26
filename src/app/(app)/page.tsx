import { VercelDeployButton } from "@/components/buttons/vercel-deploy-button";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/primitives/page-header";
import { JsonLd } from "@/components/primitives/json-ld";
import { Attribution } from "@/components/ui/attribution";
import { buttonVariants } from "@/components/ui/button";
import { TextLoop } from "@/components/ui/text-loop";
import { routes } from "@/config/routes";
import { routeMetadata } from "@/config/metadata";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { IconBrandGithub } from "@tabler/icons-react";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";

const font = Space_Grotesk({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = routeMetadata.home;

export default function Page() {
  return (
    <>
      <JsonLd
        organization
        website
        softwareSourceCode
        product={{
          name: "Bones - Next.js SaaS Boilerplate",
          description: "Free, open-source Next.js starter kit with authentication, Shadcn UI, and one-click Vercel deploy.",
          image: "https://bones.sh/og",
          price: "0",
          priceCurrency: "USD",
        }}
        faq={{
          questions: [
            {
              question: "Is Bones free to use?",
              answer: "Yes, Bones is completely free and open-source under the MIT license. You own 100% of the code.",
            },
            {
              question: "What tech stack does Bones use?",
              answer: "Bones uses Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn/UI, and supports NextAuth + Better Auth for authentication.",
            },
            {
              question: "How do I deploy Bones?",
              answer: "Click the Deploy with Vercel button for one-click deployment. No environment variables are needed to start — the setup wizard guides you through configuration.",
            },
            {
              question: "What is the difference between Bones and ShipKit?",
              answer: "Bones is the free, open-source foundation. ShipKit is the premium framework built on top of Bones that adds database (Drizzle + PostgreSQL), payments (Stripe), CMS (Payload + Builder.io), AI integrations, and 100+ additional components.",
            },
          ],
        }}
      />
      <div className="container flex flex-col items-center justify-center gap-2xl py-6 text-center min-h-screen">
        <PageHeader className="flex flex-col items-center justify-center">
          <PageHeaderHeading
            className={cn(
              "relative font-bold md:text-[6rem] py-6 flex items-center justify-center gap-3",
              font.className,
            )}
          >
            Bones
          </PageHeaderHeading>
          <PageHeaderDescription className="text-xl">
            Ship websites fast with AI.
          </PageHeaderDescription>
          <PageHeaderDescription className="text-lg text-muted-foreground">
            Launch a full-stack React + Next.js starter kit configured for
            Cursor, Claude, and Shadcn UI.
          </PageHeaderDescription>

          <div className="my-4 flex flex-col gap-md md:flex-row">
            <Link
              href={routes.external.bones_github}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <IconBrandGithub className="mr-2 h-5 w-5" /> View on GitHub
            </Link>
            <VercelDeployButton href={routes.external.vercelDeployBones} />
          </div>

          <div className="mt-auto flex flex-col items-center gap-md text-sm md:flex-row">
            <Link
              href={routes.external.shipkit}
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "text-muted-foreground hover:text-primary transition-colors",
              )}
            >
              Need a starter with batteries included?
            </Link>
          </div>
        </PageHeader>
      </div>
      <Attribution
        variant="popover"
        heading={
          <>
            Shipkit works with {/* For users of */}
            <TextLoop
              interval={10}
              className="overflow-y-clip"
              transition={{
                type: "spring",
                stiffness: 900,
                damping: 80,
                mass: 10,
              }}
              variants={{
                initial: {
                  y: 20,
                  rotateX: 90,
                  opacity: 0,
                  filter: "blur(4px)",
                },
                animate: {
                  y: 0,
                  rotateX: 0,
                  opacity: 1,
                  filter: "blur(0px)",
                },
                exit: {
                  y: -20,
                  rotateX: -90,
                  opacity: 0,
                  filter: "blur(4px)",
                },
              }}
            >
              <span>Cursor</span>
              <span>v0</span>
              <span>Shadcn/UI</span>
              <span>Next.js</span>
            </TextLoop>
          </>
        }
        description="Start your next project pre-configured with the best tools and ship faster"
        href="https://shipkit.io"
      />
    </>
  );
}
