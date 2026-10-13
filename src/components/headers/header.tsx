"use client";

import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useWindowScroll } from "@uidotdev/usehooks";
import { cva } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/lib/auth/use-session";
import type React from "react";

import { Icon } from "@/components/assets/icon";
import { LoginButton } from "@/components/buttons/sign-in-button";
import { SearchAi } from "@/components/modules/search/search-ai";
import { SearchMenu } from "@/components/modules/search/search-menu";
import { UserMenu } from "@/components/modules/user/user-menu";
import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { PriorityNav } from "@/components/ui/priority-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/shipkit/theme";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { NavLink } from "@/config/navigation";
import { defaultNavLinks as navigationDefaultNavLinks } from "@/config/navigation";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { useSignInRedirectUrl } from "@/hooks/use-auth-redirect";
import { cn } from "@/lib/utils";
import styles from "@/styles/header.module.css";
import type { User } from "@/types/user";
import { BuyButton } from "../buttons/lemonsqueezy-buy-button";

interface HeaderProps {
  navLinks?: NavLink[];
  logoHref?: string;
  logoIcon?: React.ReactNode;
  logoText?: string;
  searchPlaceholder?: string;
  /**
   * Controls which search control is rendered.
   * - "menu": renders the standard command menu search (default)
   * - "ai": renders the AI search input on the right side
   * - "none": renders no search control
   */
  searchVariant?: "ai" | "menu" | "none";
  variant?: "default" | "sticky" | "floating" | "logo-only" | "minimal";
  /**
   * When set, shows an animated CTA that switches after the given scroll threshold (in px).
   * If undefined, shows the default static CTA.
   */
  animatedCTAOnScroll?: number;
  /**
   * When set and variant is "floating", toggles opaque style after the given scroll threshold (in px).
   */
  opaqueOnScroll?: number;
  /**
   * Optional authenticated user to pass into the user menu.
   */
  user?: User | null;
  className?: string;
}

// Deprecated local defaultNavLinks; use navigationDefaultNavLinks from config instead.

const headerVariants = cva("translate-z-0 z-50 p-md", {
  variants: {
    variant: {
      default: "relative",
      floating: "fixed top-0 h-24 w-full",
      sticky:
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60",
      "logo-only": "relative",
      minimal: "relative",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const Header: React.FC<HeaderProps> = ({
  logoHref = routes.home,
  logoIcon = <Icon />,
  logoText = siteConfig.title,
  navLinks = navigationDefaultNavLinks,
  variant = "default",
  searchPlaceholder = `Search ${siteConfig.title}...`,
  searchVariant = "menu",
  animatedCTAOnScroll,
  opaqueOnScroll,
  user,
  className,
}) => {
  const [{ y }] = useWindowScroll();
  const signInRedirectUrl = useSignInRedirectUrl();
  const { data: session } = useSession();

  const isLogoOnly = variant === "logo-only";
  const isLoggedIn = !!session?.user || !!user;
  const scrollY = typeof y === "number" ? y : 0;
  const isOpaque =
    variant === "floating" && typeof opaqueOnScroll === "number" && scrollY > opaqueOnScroll;

  // Minimal variant: logo + a few text links + theme toggle. Callers can
  // pass `navLinks` to override the defaults — Bones does this because it
  // does not ship /blog or /docs, and linking to them would hit 404s
  // (Ahrefs "Internal link to broken page", LAC-3922).
  if (variant === "minimal") {
    const minimalLinks: NavLink[] =
      navLinks !== navigationDefaultNavLinks && navLinks.length > 0
        ? navLinks
        : [
            { href: routes.blog, label: "Blog" },
            { href: "/changelog", label: "Changelog" },
            { href: routes.docs, label: "Docs" },
          ];

    return (
      <header className={cn(headerVariants({ variant: "minimal" }), className)}>
        <nav className="container flex items-center justify-between gap-md">
          <div className="flex shrink-0 items-center gap-2 md:gap-4">
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-lg font-semibold md:mr-6 md:text-base"
            >
              {logoIcon}
              <span className="block whitespace-nowrap">{logoText}</span>
            </Link>

            <div className="flex items-center gap-md text-sm">
              {minimalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <ThemeToggle variant="ghost" size="icon" className="rounded-full" />
        </nav>
      </header>
    );
  }

  return (
    <header
      className={cn(
        headerVariants({ variant }),
        variant === "floating" && styles.header,
        variant === "floating" && isOpaque && styles.opaque,
        variant === "floating" &&
          isOpaque &&
          "top-[-12px] [--header-background:#fafafc70] dark:[--header-background:#1c1c2270]",
        className
      )}
    >
      {variant === "floating" && <div className="h-[12px] w-full" />}
      <nav
        className={cn(
          "container",
          isLogoOnly
            ? "flex items-center justify-center gap-md"
            : "flex items-center justify-between gap-md"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 md:gap-4",
            isLogoOnly ? "shrink-0 justify-center" : "min-w-0 flex-1 justify-start"
          )}
        >
          {!isLogoOnly && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <HamburgerMenuIcon className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="grid gap-6 font-medium">
                  <Link href={logoHref} className="flex items-center gap-2 text-lg font-semibold">
                    {logoIcon}
                    <span className="sr-only">{logoText}</span>
                  </Link>
                  {searchVariant === "menu" && (
                    <SearchMenu
                      buttonText={searchPlaceholder}
                      minimal={true}
                      buttonClassName="w-full justify-start"
                    />
                  )}
                  {searchVariant === "ai" && (
                    <SearchAi buttonText={searchPlaceholder} className="w-full" />
                  )}
                  {navLinks.map((link) => (
                    <Link
                      key={`${link.href}-${link.label}`}
                      href={link.href}
                      className={cn(
                        "text-muted-foreground hover:text-foreground",
                        link.isCurrent ? "text-foreground" : ""
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {!isLoggedIn && (
                    <>
                      <Link
                        href={routes.launch}
                        className={cn(
                          buttonVariants({ variant: "default" }),
                          "w-full justify-center"
                        )}
                      >
                        {`Get ${siteConfig.title}`}
                      </Link>
                      <Link
                        href={signInRedirectUrl}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "w-full justify-center"
                        )}
                      >
                        Login
                      </Link>
                    </>
                  )}
                  {isLoggedIn && (
                    <Link
                      href={routes.app.dashboard}
                      className={cn(
                        buttonVariants({ variant: "default" }),
                        "w-full justify-center"
                      )}
                    >
                      Dashboard
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}

          <Link
            href={logoHref}
            className="flex items-center gap-2 text-lg font-semibold md:mr-6 md:text-base"
          >
            {logoIcon}
            <span className="block whitespace-nowrap">{logoText}</span>
          </Link>

          <div className="hidden min-w-0 flex-1 md:flex">
            <PriorityNav navLinks={navLinks} />
          </div>
        </div>

        {!isLogoOnly && (
          <div className="flex shrink-0 items-center gap-2 lg:gap-4">
            {/* Search */}
            {searchVariant === "menu" && (
              <SearchMenu
                buttonText={searchPlaceholder}
                minimal={true}
                buttonClassName="hidden md:flex min-w-[40px]"
                collapsible
              />
            )}
            {searchVariant === "ai" && (
              <SearchAi
                buttonText={searchPlaceholder}
                className="hidden min-w-[40px] md:flex"
                collapsible
              />
            )}

            {!isLoggedIn && <ThemeToggle variant="ghost" size="icon" className="rounded-full" />}

            <UserMenu user={user} />

            {!isLoggedIn &&
              (animatedCTAOnScroll ? (
                <AnimatePresence mode="wait">
                  {scrollY > animatedCTAOnScroll ? (
                    <motion.div
                      key="compact"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.1 }}
                    >
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative -m-1 p-1">
                              <BuyButton />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            sideOffset={3}
                            className="-mt-3 border-none bg-transparent p-0 text-xs text-muted-foreground shadow-none select-none data-[state=delayed-open]:animate-fadeDown"
                          >
                            <LoginButton className="hover:text-foreground">or Login</LoginButton>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="full"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.1 }}
                    >
                      <LoginButton variant="outline" nextUrl={routes.app.dashboard}>
                        Dashboard
                      </LoginButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                <BuyButton />
              ))}
          </div>
        )}
      </nav>
    </header>
  );
};
