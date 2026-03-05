"use client";

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useTeam } from "@/components/providers/team-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useSidebar } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { type AvatarType, getAvatarUrl } from "@/lib/utils/avatar";
import { createTeam } from "@/server/actions/teams";
import type { Team } from "@/types/team";

// Helper to fetch user teams via API
async function fetchUserTeams(): Promise<Team[]> {
	const response = await fetch(routes.api.teams);
	if (!response.ok) {
		return [];
	}
	const data = await response.json();
	return data.teams ?? [];
}

interface TeamSwitcherProps {
	userId?: string;
	activeTeamId?: string;
	onTeamChange?: (teamId: string) => void;
	variant?: "sidebar" | "header";
}

export function TeamSwitcher({
	userId: propUserId,
	activeTeamId,
	onTeamChange,
	variant = "sidebar",
}: TeamSwitcherProps = {}) {
	const { open: sidebarOpen } = useSidebar();
	const { data: session } = useSession();
	const router = useRouter();
	const { toast } = useToast();
	const { setSelectedTeamId } = useTeam();

	// Get userId from props or session
	const userId = propUserId || session?.user?.id;

	const [teams, setTeams] = React.useState<Team[]>([]);
	const [activeTeam, setActiveTeam] = React.useState<Team>();
	const [open, setOpen] = React.useState(false);
	const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);
	const [newTeamName, setNewTeamName] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);

	React.useEffect(() => {
		if (userId) {
			fetchUserTeams().then((fetchedTeams) => {
				if (!fetchedTeams) return;

				setTeams(fetchedTeams);

				// Set the active team based on props or default to personal team
				if (activeTeamId) {
					const activeTeamFromProps = fetchedTeams.find(
						(t) => t.team.id === activeTeamId,
					);
					if (activeTeamFromProps) {
						setActiveTeam(activeTeamFromProps);
						return;
					}
				}

				const personalTeam = fetchedTeams.find(
					(t) => t.team.type === "personal",
				);
				if (personalTeam) {
					setActiveTeam(personalTeam);
				}
			});
		}
	}, [userId, activeTeamId]);

	const handleTeamSelect = (team: Team) => {
		setActiveTeam(team);
		setOpen(false);
		setSelectedTeamId(team.team.id);
		onTeamChange?.(team.team.id);
		toast({
			title: "Team switched",
			description: `Switched to ${team.team.name} team`,
		});
	};

	const handleCreateTeam = async () => {
		if (!newTeamName.trim() || !userId) return;

		setIsLoading(true);
		try {
			const team = await createTeam(userId, newTeamName.trim());
			if (!team) {
				throw new Error("Failed to create team");
			}

			// Reload teams to get the updated list for consistency
			const userTeams = await fetchUserTeams();
			setTeams(userTeams);

			// Select the newly created team
			const newTeam = userTeams.find((t) => t.team.id === team.id);
			if (newTeam && team.id) {
				setActiveTeam(newTeam);
				onTeamChange?.(team.id);
			}

			setShowNewTeamDialog(false);
			setNewTeamName("");
			router.refresh();
			toast({
				title: "Team created",
				description: `Successfully created team "${newTeamName.trim()}"`,
			});
		} catch (error) {
			console.error("Failed to create team:", error);
			toast({
				title: "Error",
				description: "Failed to create team",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Don't render if no user is available
	if (!userId) {
		return null;
	}

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"flex items-center gap-2 py-6 h-12",
							variant === "sidebar"
								? "w-full"
								: "w-[260px] max-w-full justify-between",
							variant === "sidebar" && sidebarOpen && "justify-between",
						)}
						aria-label="Select team"
					>
						<Avatar className="h-6 w-6">
							<AvatarImage
								src={
									activeTeam?.team
										? getAvatarUrl(
											activeTeam.team.name,
											activeTeam.team.type as AvatarType,
										)
										: getAvatarUrl("team")
								}
								alt={activeTeam?.team?.name || "Team"}
							/>
							<AvatarFallback>
								{activeTeam?.team?.name?.charAt(0) || "T"}
							</AvatarFallback>
						</Avatar>
						{(variant === "header" || sidebarOpen) && (
							<>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">
										{activeTeam?.team?.name || "Select Team"}
									</span>
									<span className="truncate text-xs capitalize text-muted-foreground">
										{activeTeam?.role || "No team selected"}
										{activeTeam?.team?.type === "personal" && " (Personal)"}
									</span>
								</div>
								<CaretSortIcon className="h-4 w-4 shrink-0 opacity-50" />
							</>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className={cn(
						"p-0",
						variant === "header"
							? "w-[260px]"
							: sidebarOpen
								? "w-[var(--radix-popover-trigger-width)]"
								: undefined,
					)}
					align="start"
				>
					<Command>
						<CommandInput placeholder="Search team..." />
						<CommandList>
							<CommandEmpty>No teams found.</CommandEmpty>
							{teams.length > 0 && (
								<>
									{/* Personal Team */}
									<CommandGroup heading="Personal">
										{teams
											.filter((t) => t.team.type === "personal")
											.map((team) => (
												<CommandItem
													key={team.team.id}
													onSelect={() => handleTeamSelect(team)}
													className="text-sm"
												>
													<Avatar className="mr-2 h-5 w-5">
														<AvatarImage
															src={getAvatarUrl(
																team.team.name,
																team.team.type as AvatarType,
															)}
															alt={team.team.name}
														/>
														<AvatarFallback>
															{team.team.name.charAt(0)}
														</AvatarFallback>
													</Avatar>
													{team.team.name}
													<CheckIcon
														className={cn(
															"ml-auto h-4 w-4",
															activeTeam?.team.id === team.team.id
																? "opacity-100"
																: "opacity-0",
														)}
													/>
												</CommandItem>
											))}
									</CommandGroup>
									{/* Other Teams */}
									{teams.filter((t) => t.team.type === "workspace").length >
										0 && (
											<CommandGroup heading="Teams">
												{teams
													.filter((t) => t.team.type === "workspace")
													.map((team) => (
														<CommandItem
															key={team.team.id}
															onSelect={() => handleTeamSelect(team)}
															className="text-sm"
														>
															<Avatar className="mr-2 h-5 w-5">
																<AvatarImage
																	src={getAvatarUrl(
																		team.team.name,
																		team.team.type as AvatarType,
																	)}
																	alt={team.team.name}
																/>
																<AvatarFallback>
																	{team.team.name.charAt(0)}
																</AvatarFallback>
															</Avatar>
															{team.team.name}
															<CheckIcon
																className={cn(
																	"ml-auto h-4 w-4",
																	activeTeam?.team.id === team.team.id
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
														</CommandItem>
													))}
											</CommandGroup>
										)}
								</>
							)}
							<CommandSeparator />
							<CommandGroup>
								<CommandItem
									onSelect={() => {
										setOpen(false);
										setShowNewTeamDialog(true);
									}}
									className="text-sm"
								>
									<PlusIcon className="mr-2 h-4 w-4" />
									Create Team
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			<Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create team</DialogTitle>
						<DialogDescription>
							Add a new team to manage projects and collaborate with others.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2 pb-4">
						<div className="space-y-2">
							<Label htmlFor="name">Team name</Label>
							<Input
								id="name"
								placeholder="Acme Inc."
								value={newTeamName}
								onChange={(e) => setNewTeamName(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowNewTeamDialog(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateTeam}
							disabled={!newTeamName.trim() || isLoading}
						>
							{isLoading ? "Creating..." : "Continue"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
