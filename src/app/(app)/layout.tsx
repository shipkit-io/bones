import type { Metadata } from "next";
import type React from "react";

import MainLayout from "@/components/layouts/main-layout";
import { RootLayout } from "@/components/layouts/root-layout";
import { JsonLd } from "@/components/primitives/json-ld";
import { metadata as defaultMetadata } from "@/config/metadata";

export const metadata: Metadata = {
  ...defaultMetadata,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout>
      {/*
       * Organization / WebSite / SoftwareSourceCode belong on every page, so they
       * live here rather than on the home page alone (LAC-5573). Pages adding
       * their own schema pass `siteWide={false}` so these nodes stay declared once.
       */}
      <JsonLd id="json-ld-site" />
      <MainLayout>{children}</MainLayout>
    </RootLayout>
  );
}
