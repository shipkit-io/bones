import { FileIcon, PlusIcon } from "@radix-ui/react-icons";
import { ProjectDialog } from "@/components/modules/projects/project-dialog";
import { ProjectMenu } from "@/components/modules/projects/project-menu";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteProject } from "@/server/actions/projects";
import { auth } from "@/server/auth";
import { projectService } from "@/server/services/project-service";
import { teamService } from "@/server/services/team-service";

export async function ProjectsList() {
	const session = await auth();
	if (!session?.user) return null;

	// Get user's teams and their projects
	const userTeams = await teamService.getUserTeams(session.user.id);
	if (!userTeams.length) return null;

	// Use the first team as the default team
	const defaultTeam = userTeams[0]?.team;
	if (!defaultTeam) return null;
	const projectsResult = await projectService.getTeamProjects(defaultTeam.id);
	const projects = projectsResult || [];

	const visibleProjects = projects.slice(0, 3);
	const collapsedProjects = projects.slice(3);
	const hasCollapsedProjects = collapsedProjects.length > 0;

	return (
		<SidebarGroup className="space-y-1 pb-10">
			<div className="flex items-center justify-between py-2">
				<SidebarGroupLabel>Projects</SidebarGroupLabel>
				<ProjectDialog userId={session.user.id} variant="create">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 rounded-md hover:bg-accent hover:text-accent-foreground"
							>
								<PlusIcon className="h-4 w-4" />
								<span className="sr-only">Create Project</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Create Project</TooltipContent>
					</Tooltip>
				</ProjectDialog>
			</div>

			<SidebarMenu>
				{/* Always visible projects */}
				{visibleProjects.map((project) => (
					<SidebarMenuItem key={project.id}>
						<div className="flex items-center justify-between rounded-md hover:bg-accent gap-2">
							<SidebarMenuButton asChild className="w-full">
								<div className="flex items-center gap-2">
									<FileIcon className="h-4 w-4" />
									<span className="truncate text-sm">{project.name}</span>
								</div>
							</SidebarMenuButton>
							<ProjectMenu project={project} teamId={defaultTeam.id} deleteAction={deleteProject} />
						</div>
					</SidebarMenuItem>
				))}

				{/* Collapsible section for additional projects */}
				{/* {hasCollapsedProjects && (
					<Collapsible className="group/collapsible">
						<CollapsibleContent>
							{collapsedProjects.map((project) => (
								<SidebarMenuItem key={project.id}>
									<div className="flex items-center justify-between rounded-md hover:bg-accent gap-2">
										<SidebarMenuButton asChild className="w-full">
											<div className="flex items-center gap-2">
												<FileIcon className="h-4 w-4" />
												<span className="truncate text-sm">{project.name}</span>
											</div>
										</SidebarMenuButton>
										<ProjectMenu
											project={project}
											teamId={defaultTeam.id}
											deleteAction={deleteProject}
										/>
									</div>
								</SidebarMenuItem>
							))}
						</CollapsibleContent>
						<CollapsibleTrigger asChild>
							<SidebarMenuItem>
								<div className="text-center px-2 text-sm text-muted-foreground/50 hover:text-foreground cursor-pointer transition-colors duration-200">
									See <span className="group-data-[state=open]/collapsible:hidden">more</span>
									<span className="hidden group-data-[state=open]/collapsible:inline">less</span>{" "}
									{collapsedProjects.length === 1 ? "project" : "projects"}
								</div>
							</SidebarMenuItem>
						</CollapsibleTrigger>
					</Collapsible>
				)} */}
			</SidebarMenu>
		</SidebarGroup>
	);
}
