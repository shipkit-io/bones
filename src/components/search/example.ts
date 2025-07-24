import type { MainNavItem, SidebarNavItem } from "@/types/nav";
import { routes } from "@/config/routes";

export interface DocsConfig {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
  chartsNav: SidebarNavItem[];
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Home",
      href: routes.home,
    },
    {
      title: "Features",
      href: routes.features,
    },
    {
      title: "CLI",
      href: routes.cli,
    },
    {
      title: "Sign In",
      href: routes.auth.signIn,
    },
    {
      title: "Shipkit",
      href: routes.external.shipkit,
      external: true,
    },
  ],
  sidebarNav: [
    {
      title: "Main Pages",
      items: [
        {
          title: "Home",
          href: routes.home,
          items: [],
        },
        {
          title: "Features",
          href: routes.features,
          items: [],
        },
        {
          title: "CLI",
          href: routes.cli,
          items: [],
        },
        {
          title: "Bones CLI WWW",
          href: routes.bones.cliWww,
          items: [],
        },
      ],
    },
    {
      title: "Authentication",
      items: [
        {
          title: "Sign In",
          href: routes.auth.signIn,
          items: [],
        },
        {
          title: "Sign Up",
          href: routes.auth.signUp,
          items: [],
        },
        {
          title: "Forgot Password",
          href: routes.auth.forgotPassword,
          items: [],
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          title: "Terms of Service",
          href: routes.terms,
          items: [],
        },
        {
          title: "Privacy Policy",
          href: routes.privacy,
          items: [],
        },
      ],
    },
    {
      title: "Demo",
      items: [
        {
          title: "tRPC Demo",
          href: routes.demo.trpc,
          items: [],
        },
      ],
    },
    {
      title: "External Links",
      items: [
        {
          title: "Shipkit",
          href: routes.external.shipkit,
          label: "External",
          items: [],
        },
        {
          title: "GitHub",
          href: routes.external.github,
          label: "External",
          items: [],
        },
      ],
    },
  ],
  chartsNav: [
    {
      title: "Quick Links",
      items: [
        {
          title: "Home",
          href: routes.home,
          items: [],
        },
        {
          title: "Features",
          href: routes.features,
          items: [],
        },
      ],
    },
  ],
};
