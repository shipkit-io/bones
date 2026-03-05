"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cva, type VariantProps } from "class-variance-authority";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTeam } from "@/components/providers/team-provider";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { routes } from "@/config/routes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createProject, updateProject } from "@/server/actions/projects";
import { createTeam } from "@/server/actions/teams";

// Helper to fetch user teams via API
async function fetchUserTeams(): Promise<Team[]> {
	const response = await fetch(routes.api.teams);
	if (!response.ok) {
		return [];
	}
	const data = await response.json();
	return data.teams ?? [];
}

const projectDialogVariants = cva("", {
	variants: {
		variant: {
			create: "",
			createWithTeam: "",
			edit: "",
		},
	},
	defaultVariants: {
		variant: "create",
	},
});

interface Team {
	team: {
		id: string;
		name: string;
		createdAt?: Date;
		updatedAt?: Date | null;
	};
	role: string;
}

interface Project {
	id: string;
	name: string;
	teamId?: string;
}

const formSchema = z.object({
	name: z.string().min(1, "Project name is required"),
	teamId: z.string().min(1, "Team is required"),
});

interface ProjectDialogProps
	extends VariantProps<typeof projectDialogVariants> {
	userId: string;
	children?: React.ReactNode;
	className?: string;
	project?: Project;
}

/**
 * Unified project dialog component that can be used for both creating and editing projects.
 *
 * @param variant - "create" for basic project creation, "createWithTeam" to enable team creation, or "edit" for editing projects
 * @param userId - The ID of the current user
 * @param children - Optional trigger element
 * @param className - Optional additional classes
 * @param project - The project to edit (required when variant is "edit")
 */
export function ProjectDialog({
	variant = "create",
	userId,
	children,
	className,
	project,
}: ProjectDialogProps) {
	const { toast } = useToast();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [teams, setTeams] = useState<Team[]>([]);
	const [defaultTeamId, setDefaultTeamId] = useState<string>("");
	const { selectedTeamId } = useTeam();

	// Team creation specific state (only used when variant is "createWithTeam")
	const [showNewTeamInput, setShowNewTeamInput] = useState(false);
	const [newTeamName, setNewTeamName] = useState("");

	const isEditMode = variant === "edit";
	const canCreateTeam = variant === "createWithTeam";

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: isEditMode && project ? project.name : "",
			teamId:
				isEditMode && project?.teamId
					? project.teamId
					: selectedTeamId || defaultTeamId || "",
		},
	});

	// Update form values when project changes in edit mode
	useEffect(() => {
		if (isEditMode && project) {
			form.setValue("name", project.name);
			if (project.teamId) {
				form.setValue("teamId", project.teamId);
			}
		}
	}, [form, isEditMode, project]);

	// Load teams when dialog opens
	useEffect(() => {
		const loadTeams = async () => {
			try {
				const userTeams = await fetchUserTeams();
				setTeams(userTeams);

				// Set default team ID if teams are available
				if (userTeams.length > 0 && userTeams[0]?.team?.id) {
					const firstTeamId = userTeams[0].team.id;
					setDefaultTeamId(firstTeamId);

					// Set form value if not already set and in create mode
					if (!isEditMode && !form.getValues("teamId")) {
						// Prioritize selectedTeamId from context if available
						form.setValue("teamId", selectedTeamId || firstTeamId);
					}
				}
			} catch (error) {
				console.error("Failed to load teams:", error);
				toast({
					title: "Error",
					description: "Failed to load teams. Please try again.",
					variant: "destructive",
				});
			}
		};

		if (isOpen) {
			loadTeams();
		}
	}, [isOpen, selectedTeamId, form, toast, isEditMode]);

	// Handle team creation (only for createWithTeam variant)
	const handleCreateTeam = async () => {
		if (!newTeamName) return;
		setIsLoading(true);
		try {
			const team = await createTeam(userId, newTeamName);
			if (!team) {
				throw new Error("Failed to create team");
			}
			form.setValue("teamId", team.id || "");
			setShowNewTeamInput(false);
			setNewTeamName("");

			// Reload teams to get the updated list
			const userTeams = await fetchUserTeams();
			setTeams(userTeams);

			toast({
				title: "Success",
				description: `Team "${newTeamName}" has been created.`,
			});
		} catch (error) {
			console.error("Failed to create team:", error);
			toast({
				title: "Error",
				description: "Failed to create team. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Handle form submission (create or update project)
	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsLoading(true);
		try {
			if (!isEditMode) {
				await createProject(values.name, values.teamId, userId);
				toast({
					title: "Success",
					description: `Project "${values.name}" has been created.`,
				});
			} else if (project) {
				await updateProject(project.id, values.name);
				toast({
					title: "Success",
					description: `Project "${values.name}" has been updated.`,
				});
			}
			setIsOpen(false);
			form.reset();
			router.refresh();
		} catch (error) {
			console.error(
				`Failed to ${isEditMode ? "update" : "create"} project:`,
				error,
			);
			toast({
				title: "Error",
				description: `Failed to ${isEditMode ? "update" : "create"} project. Please try again.`,
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Determine dialog title and button text based on variant
	const dialogTitle = isEditMode ? "Edit Project" : "Create Project";
	const dialogDescription = isEditMode
		? "Update your project details."
		: "Create a new project to organize your work.";
	const submitButtonText = isLoading
		? isEditMode
			? "Updating..."
			: "Creating..."
		: isEditMode
			? "Update Project"
			: "Create Project";

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{children ? (
					<div>{children}</div>
				) : (
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						{isEditMode ? "Edit Project" : "Create Project"}
					</Button>
				)}
			</DialogTrigger>
			<DialogContent
				className={cn(projectDialogVariants({ variant }), className)}
			>
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
					<DialogDescription>{dialogDescription}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Project Name</FormLabel>
									<FormControl>
										<Input
											placeholder="Project name"
											{...field}
											autoComplete="off"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Only show team selection in create mode */}
						{!isEditMode &&
							(canCreateTeam && showNewTeamInput ? (
								<div className="space-y-2">
									<FormLabel>New Team Name</FormLabel>
									<div className="flex gap-2">
										<Input
											placeholder="My Team"
											value={newTeamName}
											onChange={(e) => setNewTeamName(e.target.value)}
										/>
										<Button
											type="button"
											onClick={handleCreateTeam}
											disabled={!newTeamName || isLoading}
										>
											Create Team
										</Button>
									</div>
									<Button
										type="button"
										variant="ghost"
										onClick={() => setShowNewTeamInput(false)}
									>
										Cancel
									</Button>
								</div>
							) : (
								<FormField
									control={form.control}
									name="teamId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Team</FormLabel>
											{teams.length === 1 && teams[0]?.team?.name ? (
												<div className="text-sm text-muted-foreground">
													{teams[0].team.name}
												</div>
											) : (
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select a team" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{canCreateTeam && (
															<Button
																type="button"
																variant="ghost"
																className="w-full justify-start"
																onClick={() => setShowNewTeamInput(true)}
															>
																<Plus className="mr-2 h-4 w-4" />
																Create New Team
															</Button>
														)}
														{teams.map(({ team }) => (
															<SelectItem key={team.id} value={team.id}>
																{team.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>
							))}

						<DialogFooter>
							<Button type="submit" disabled={isLoading}>
								{submitButtonText}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
