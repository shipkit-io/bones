import type { ReactNode } from "react";
import { Header } from "@/components/headers/header";
import MainLayout from "@/components/layouts/main-layout";
import { bonesRoutes } from "@/config/bones-routes";
import type { NavLink } from "@/config/navigation";
import { routes } from "@/config/routes";

const changelogNavLinks: NavLink[] = [
  { href: routes.features, label: "Features" },
  { href: bonesRoutes.changelog, label: "Changelog" },
  { href: routes.faq, label: "FAQ" },
];

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout header={<Header variant="minimal" navLinks={changelogNavLinks} />} footer={null}>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">{children}</div>
    </MainLayout>
  );
}
