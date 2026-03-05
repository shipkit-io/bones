"use client";

import { DotsHorizontalIcon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuAction } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { ProjectDialog } from "./project-dialog";

interface Project {
	id: string;
	name: string;
}

interface ProjectMenuProps {
	project: Project;
	teamId: string;
	deleteAction: (projectId: string) => Promise<boolean>;
}

export const ProjectMenu = ({ project, teamId, deleteAction }: ProjectMenuProps) => {
	const { toast } = useToast();
	const router = useRouter();
	const { data: session } = useSession();

	const handleDelete = async () => {
		try {
			const success = await deleteAction(project.id);
			if (success) {
				toast({
					title: "Project deleted",
					description: `${project.name} has been successfully deleted.`,
				});
				router.refresh();
			} else {
				throw new Error("Failed to delete project");
			}
		} catch (error) {
			console.error("Failed to delete project:", error);
			toast({
				title: "Error",
				description: "Failed to delete project. Please try again.",
				variant: "destructive",
			});
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuAction className="h-6 w-6 rounded-md hover:bg-primary/5 hover:text-accent-foreground flex items-center justify-center">
					<DotsHorizontalIcon className="h-4 w-4" />
					<span className="sr-only">More</span>
				</SidebarMenuAction>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48" align="start">
				<ProjectDialog variant="edit" project={project} userId={session?.user?.id || ""}>
					<DropdownMenuItem className="flex items-center gap-2 px-2 py-1.5">
						<Pencil2Icon className="h-4 w-4" />
						<span className="text-sm">Rename Project</span>
					</DropdownMenuItem>
				</ProjectDialog>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleDelete}
					className="flex items-center gap-2 px-2 py-1.5 text-destructive focus:bg-destructive focus:text-destructive-foreground"
				>
					<TrashIcon className="h-4 w-4 text-current" />
					<span className="text-sm">Delete Project</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
