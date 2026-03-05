import { TeamSwitcher } from "@/components/blocks/team-switcher";
import { ProjectSwitcher } from "@/components/blocks/project-switcher";
import { DashboardHeaderHomeLink } from "@/components/blocks/dashboard-header-home-link";
import { UserMenu } from "@/components/modules/user/user-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/server/auth";

export const DashboardHeader = async () => {
    const session = await auth();

    return (
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-3 px-4">
                {/* Keep a sidebar trigger on mobile so the off-canvas sidebar is still accessible. */}
                <SidebarTrigger className="-ml-1 md:hidden" />

                <div className="flex min-w-0 items-center gap-2">
                    <div className="truncate text-sm font-semibold">
                        <DashboardHeaderHomeLink />
                    </div>

                    <Separator orientation="vertical" className="hidden h-4 md:block" />

                    <div className="hidden items-center gap-2 md:flex">
                        <TeamSwitcher variant="header" />
                        <ProjectSwitcher />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 px-4 pb-3 md:hidden">
                <TeamSwitcher variant="header" />
                <ProjectSwitcher />
            </div>
        </header>
    );
};

