import type { MainNavItem, SidebarNavItem } from "@/types/nav";

export interface DocsConfig {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
  chartsNav: SidebarNavItem[];
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Features",
      href: "/features",
    },
    {
      title: "CLI",
      href: "/cli",
    },
    {
      title: "Sign In",
      href: "/sign-in",
    },
    {
      title: "Shipkit",
      href: "https://shipkit.io",
      external: true,
    },
  ],
  sidebarNav: [
    {
      title: "Main Pages",
      items: [
        {
          title: "Home",
          href: "/",
          items: [],
        },
        {
          title: "Features",
          href: "/features",
          items: [],
        },
        {
          title: "CLI",
          href: "/cli",
          items: [],
        },
        {
          title: "Bones CLI WWW",
          href: "/bones/cli-www",
          items: [],
        },
      ],
    },
    {
      title: "Authentication",
      items: [
        {
          title: "Sign In",
          href: "/sign-in",
          items: [],
        },
        {
          title: "Sign Up",
          href: "/sign-up",
          items: [],
        },
        {
          title: "Forgot Password",
          href: "/forgot-password",
          items: [],
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          title: "Terms of Service",
          href: "/terms-of-service",
          items: [],
        },
        {
          title: "Privacy Policy",
          href: "/privacy-policy",
          items: [],
        },
      ],
    },
    {
      title: "Demo",
      items: [
        {
          title: "tRPC Demo",
          href: "/trpc",
          items: [],
        },
      ],
    },
    {
      title: "External Links",
      items: [
        {
          title: "Shipkit",
          href: "https://shipkit.io",
          label: "External",
          items: [],
        },
        {
          title: "GitHub",
          href: "https://github.com/shipkit-io/bones",
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
          href: "/",
          items: [],
        },
        {
          title: "Features",
          href: "/features",
          items: [],
        },
      ],
    },
  ],
};
