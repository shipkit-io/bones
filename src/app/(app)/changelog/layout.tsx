import type { ReactNode } from "react";
import { Header } from "@/components/headers/header";
import MainLayout from "@/components/layouts/main-layout";

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout header={<Header variant="minimal" />} footer={null}>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </div>
    </MainLayout>
  );
}
