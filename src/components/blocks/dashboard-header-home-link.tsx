"use client";

import { Icon } from "@/components/assets/icon";
import { Logo } from "@/components/assets/logo";
import { Link } from "@/components/primitives/link";
import { useSidebar } from "@/components/ui/sidebar";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

interface DashboardHeaderHomeLinkProps {
    className?: string;
}

export const DashboardHeaderHomeLink = ({ className }: DashboardHeaderHomeLinkProps) => {
    const { state } = useSidebar();

    return (
        <Link
            href={routes.app.dashboard}
            aria-label="Dashboard home"
            className={cn("flex items-center justify-center", state === "expanded" ? "min-w-56 mr-2 justify-start" : "min-w-6", className)}
        >
            {state === "expanded" ? <Logo className="" /> : <Icon className="h-6 w-6" />}
        </Link>
    );
};

