"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableDialog } from "@/components/ui/data-table/data-table-dialog";
import { routes } from "@/config/routes";
import { env } from "@/env";
import { useTeamId } from "@/hooks/use-team-id";
import { useToast } from "@/hooks/use-toast";
import { LocalProjectStorage } from "@/lib/local-storage/project-storage";
import { LocalTeamStorage } from "@/lib/local-storage/team-storage";
import {
	createProject,
	deleteProject,
	updateProject,
} from "@/server/actions/projects";

// Helper to fetch team projects via API
async function fetchTeamProjects(teamId: string): Promise<any[]> {
	const response = await fetch(`${routes.api.projects}?teamId=${encodeURIComponent(teamId)}`);
	if (!response.ok) {
		return [];
	}
	const data = await response.json();
	return data.projects ?? [];
}

interface Project {
	id: string;
	name: string;
	teamId: string;
	team: {
		id: string;
		name: string;
	};
	members: {
		id: string;
		userId: string;
		role: string;
		user: {
			id: string;
			name: string | null;
			email: string;
		};
	}[];
}

export default function ProjectsPage() {
	const { data: session } = useSession();
	if (!session?.user?.name || !session?.user?.email) {
		redirect(routes.auth.signIn);
	}

	const { toast } = useToast();
	const selectedTeamId = useTeamId();

	const [projects, setProjects] = useState<Project[]>([]);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [newProjectName, setNewProjectName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (selectedTeamId && session?.user?.id) {
			void loadProjects();
		}
	}, [selectedTeamId, session?.user?.id]);

	const loadProjects = async () => {
		if (!selectedTeamId || !session?.user?.id || !session?.user?.name || !session?.user?.email)
			return;

		try {
			const fetchedProjects = await fetchTeamProjects(selectedTeamId);
			if (!fetchedProjects || fetchedProjects.length === 0) {
				// If no projects and no db, initialize demo data
				if (!env.NEXT_PUBLIC_FEATURE_DATABASE_ENABLED) {
					LocalTeamStorage.initializeDemoData(
						session.user.id,
						session.user.name,
						session.user.email
					);
					LocalProjectStorage.initializeDemoData(session.user.id, selectedTeamId);
					// Reload projects after seeding demo data
					const demoProjects = await fetchTeamProjects(selectedTeamId);
					setProjects(mapProjects(demoProjects || []));
					return;
				}
			}
			setProjects(mapProjects(fetchedProjects || []));
		} catch (error) {
			console.error("Failed to load projects:", error);
			toast({
				title: "Error",
				description: "Failed to load projects. Please try again.",
				variant: "destructive",
			});
		}
	};

	const mapProjects = (projectsToMap: any[]) => {
		return projectsToMap.map((project) => ({
			...project,
			teamId: project.teamId ?? selectedTeamId,
			team: project.team ?? { id: selectedTeamId, name: "Default Team" },
		}));
	};

	const handleCreateProject = async () => {
		if (!session?.user?.id || !selectedTeamId) return;

		setIsSubmitting(true);
		try {
			await createProject(newProjectName, selectedTeamId, session.user.id);
			await loadProjects();
			setShowCreateDialog(false);
			setNewProjectName("");
			toast({
				title: "Success",
				description: "Project created successfully.",
			});
		} catch (error) {
			console.error("Failed to create project:", error);
			toast({
				title: "Error",
				description: "Failed to create project. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdateProject = async () => {
		if (!selectedProject) return;

		setIsSubmitting(true);
		try {
			await updateProject(selectedProject.id, newProjectName);
			await loadProjects();
			setShowEditDialog(false);
			setSelectedProject(null);
			setNewProjectName("");
			toast({
				title: "Success",
				description: "Project updated successfully.",
			});
		} catch (error) {
			console.error("Failed to update project:", error);
			toast({
				title: "Error",
				description: "Failed to update project. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteProject = async (project: Project) => {
		try {
			await deleteProject(project.id);
			await loadProjects();
			toast({
				title: "Success",
				description: "Project deleted successfully.",
			});
		} catch (error) {
			console.error("Failed to delete project:", error);
			toast({
				title: "Error",
				description: "Failed to delete project. Please try again.",
				variant: "destructive",
			});
		}
	};

	const columns: ColumnDef<Project>[] = [
		{
			accessorKey: "name",
			header: "Name",
		},
		{
			accessorKey: "team.name",
			header: "Team",
		},
		{
			id: "actions",
			cell: ({ row }) => (
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={() => {
							setSelectedProject(row.original);
							setNewProjectName(row.original.name);
							setShowEditDialog(true);
						}}
						className="text-sm text-gray-600 hover:text-gray-900"
					>
						Edit
					</button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<button type="button" className="text-sm text-red-600 hover:text-red-900">
								Delete
							</button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Project</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete this project? This action will also delete all
									associated API keys and cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => handleDeleteProject(row.original)}
									className="bg-red-600 hover:bg-red-700"
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			),
		},
	];

	return (
		<div className="container mx-auto py-10">
			<DataTable
				columns={columns}
				data={projects}
				onAdd={() => setShowCreateDialog(true)}
				addButtonLabel="Create Project"
			/>

			<DataTableDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				title="Create Project"
				description="Enter the details for your new project."
				onSubmit={handleCreateProject}
				submitLabel="Create"
				isSubmitting={isSubmitting}
				fields={[
					{
						label: "Name",
						value: newProjectName,
						onChange: setNewProjectName,
						placeholder: "Enter project name",
					},
				]}
			/>

			<DataTableDialog
				open={showEditDialog}
				onOpenChange={setShowEditDialog}
				title="Edit Project"
				description="Update your project details."
				onSubmit={handleUpdateProject}
				submitLabel="Update"
				isSubmitting={isSubmitting}
				fields={[
					{
						label: "Name",
						value: newProjectName,
						onChange: setNewProjectName,
						placeholder: "Enter project name",
					},
				]}
			/>
		</div>
	);
}
