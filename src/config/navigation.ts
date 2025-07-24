import { routes } from "@/config/routes";

export interface NavLink {
  href: string;
  label: string;
  isCurrent?: boolean;
  /** Determines visibility based on authentication status.
   * - 'authenticated': Show only if the user is logged in.
   * - 'unauthenticated': Show only if the user is logged out.
   * - undefined: Always show the link.
   */
  authVisibility?: "authenticated" | "unauthenticated";
}

export const defaultNavLinks: NavLink[] = [
  { href: routes.home, label: "Home" },
  { href: routes.external.shipkit, label: "Shipkit" },
];
