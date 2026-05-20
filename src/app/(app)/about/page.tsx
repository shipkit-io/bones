import type { Metadata } from "next";
import { Link } from "@/components/primitives/link";
import { constructMetadata, routeMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = constructMetadata(routeMetadata.about);

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="mb-6 text-4xl font-bold tracking-tight">
        About {siteConfig.branding.projectName}
      </h1>

      <section className="mb-10">
        <p className="mb-4 text-lg text-muted-foreground">
          {siteConfig.branding.projectName} is a modern development platform
          built for teams and individuals who want to ship production-ready apps
          without the boilerplate. We handle the infrastructure so you can focus
          on what makes your product unique.
        </p>
        <p className="text-muted-foreground">
          Built with Next.js, TypeScript, and the tools developers already know
          and love &mdash; Tailwind CSS, shadcn/ui, Drizzle ORM, and more.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-semibold">Our Mission</h2>
        <p className="text-muted-foreground">
          We believe shipping software should be fast, repeatable, and enjoyable.
          Our goal is to eliminate the weeks of setup that come before you can
          write your first line of business logic.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-semibold">Built By</h2>
        <p className="text-muted-foreground">
          Created and maintained by{" "}
          <Link
            href={siteConfig.creator.url}
            className="text-foreground underline underline-offset-4"
          >
            {siteConfig.creator.fullName}
          </Link>
          , {siteConfig.creator.bio}
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Get in Touch</h2>
        <p className="text-muted-foreground">
          Have questions or want to learn more?{" "}
          <Link
            href={routes.contact}
            className="text-foreground underline underline-offset-4"
          >
            Contact us
          </Link>{" "}
          or find us on{" "}
          <Link
            href={siteConfig.links.github}
            className="text-foreground underline underline-offset-4"
          >
            GitHub
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
