"use client";

import { Icons } from "@/components/images/icons";
import { Link } from "@/components/primitives/link";
import { buttonVariants } from "@/components/ui/button";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { useWindowScroll } from "@uidotdev/usehooks";
import { Code2Icon, HomeIcon } from "lucide-react";

const data = {
  navbar: [
    { href: routes.home, icon: HomeIcon, label: "Home" },
    { href: routes.docs, icon: Code2Icon, label: "Docs" },
  ],
  contact: {
    social: {
      GitHub: {
        name: "GitHub",
        url: routes.external.github,
        icon: Icons.github,
      },
      // LinkedIn: {
      //   name: "LinkedIn",
      //   url: "#",
      //   icon: Icons.linkedin,
      // },
      X: {
        name: "X",
        url: routes.external.x,
        icon: Icons.x,
      },
      email: {
        name: "Email",
        url: routes.external.email,
        icon: Icons.email,
      },
    },
  },
};

const LinkOrIcon = ({
  href,
  ...props
}: { href?: string } & React.ComponentPropsWithoutRef<"a">) => {
  return href ? <Link href={href} {...props} /> : <a {...props} />;
};

const SOCIAL_DOCK_BUFFER = 200;

export const SocialDock = ({ className }: { className?: string }) => {
  const [{ y }] = useWindowScroll();
  const isNearTop = y && y < SOCIAL_DOCK_BUFFER;
  const isNearBottom =
    y &&
    y < document.body.scrollHeight - window.innerHeight - SOCIAL_DOCK_BUFFER;
  const isHidden = isNearTop || isNearBottom;

  return (
    <>
      <Dock
        direction="middle"
        className={cn(
          "pointer-events-none bg-white/15 opacity-0 transition-opacity delay-100 duration-500 dark:bg-black/15",
          isHidden && "pointer-events-auto opacity-100",
          className,
        )}
      >
        {data.navbar.map((item) => (
          <DockIcon key={item.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <LinkOrIcon
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12 rounded-full",
                  )}
                >
                  <item.icon className="size-4" />
                </LinkOrIcon>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
        ))}
        <Separator orientation="vertical" className="h-full" />
        {Object.entries(data.contact.social).map(([name, social]) => (
          <DockIcon key={name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <LinkOrIcon
                  href={social.url}
                  aria-label={social.name}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12 rounded-full",
                  )}
                >
                  <social.icon className="size-4" />
                </LinkOrIcon>
              </TooltipTrigger>
              <TooltipContent>
                <p>{name}</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
        ))}
        <Separator orientation="vertical" className="h-full py-2" />
        <DockIcon>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ThemeToggle className="size-12 rounded-full" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Theme</p>
            </TooltipContent>
          </Tooltip>
        </DockIcon>
      </Dock>
    </>
  );
};
