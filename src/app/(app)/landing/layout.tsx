import { Footer } from "@/components/footers/extended-footer";
import { Header } from "@/components/headers/header";
import MainLayout from "@/components/layouts/main-layout";
import type React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout
      // Blur and settle the marketing header immediately when visitors start scrolling.
      header={
        <Header searchVariant={"ai"} variant="floating" opaqueOnScroll={0} />
      }
      footer={<Footer />}
    >
      {children}
    </MainLayout>
  );
}
