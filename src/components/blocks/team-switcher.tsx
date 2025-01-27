"use client";

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
import { cn } from "@/lib/utils";
import { createTeam, getUserTeams } from "@/server/actions/teams";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as React from "react";

const getAvatarUrl = (name: string, type: "personal" | "workspace" = "workspace") => {
	// Create a consistent hash for the team name
	const hash = name.split("").reduce((acc, char) => {
		return char.charCodeAt(0) + ((acc << 5) - acc);
	}, 0);

	// Use different styles for personal vs workspace teams
	// @see https://www.dicebear.com/styles/
	const style = type === "personal" ? "glass" : "pixel-art";

	// Generate a color based on the hash
	const colors = ["2ecc71", "3498db", "9b59b6", "f1c40f", "e74c3c", "1abc9c", "34495e"];
	const color = colors[Math.abs(hash) % colors.length];

	return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(name)}&backgroundColor=${color}`;
};

export function TeamSwitcher() {
	const { open: sidebarOpen } = useSidebar();
	const { data: session } = useSession();
	const router = useRouter();
	const { toast } = useToast();
	const [teams, setTeams] = React.useState<
		Awaited<ReturnType<typeof getUserTeams>>
	>([]);
	const [activeTeam, setActiveTeam] = React.useState<(typeof teams)[0]>();
	const [open, setOpen] = React.useState(false);
	const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);
	const [newTeamName, setNewTeamName] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);

	React.useEffect(() => {
		if (session?.user?.id) {
			getUserTeams(session.user.id).then((fetchedTeams) => {
				setTeams(fetchedTeams);
				const personalTeam = fetchedTeams.find(
					(t) => t.team.type === "personal",
				);
				if (personalTeam) {
					setActiveTeam(personalTeam);
				}
			});
		}
	}, [session?.user?.id]);

	const handleCreateTeam = async () => {
		if (!session?.user?.id) return;
		setIsLoading(true);
		try {
			const team = await createTeam(session.user.id, newTeamName);
			setTeams((prev) => [...prev, { team, role: "owner" as const }]);
			setActiveTeam({ team, role: "owner" as const });
			setShowNewTeamDialog(false);
			setNewTeamName("");
			router.refresh();
			toast({
				title: "Team created",
				description: `Successfully created team "${newTeamName}"`,
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

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className={cn("flex w-full items-center gap-2", sidebarOpen && "justify-between py-6")}
					>
						<Avatar className="h-6 w-6">
							<AvatarImage
								src={activeTeam?.team ? getAvatarUrl(activeTeam.team.name, activeTeam.team.type) : getAvatarUrl("team")}
								alt={activeTeam?.team?.name || "Team"}
							/>
							<AvatarFallback>
								{activeTeam?.team?.name?.charAt(0) || "T"}
							</AvatarFallback>
						</Avatar>
						{sidebarOpen && <>
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
						}
					</Button>
				</PopoverTrigger>
				<PopoverContent className={cn("p-0", sidebarOpen && "w-[var(--radix-popover-trigger-width)]")} align="start">
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
													onSelect={() => {
														setActiveTeam(team);
														setOpen(false);
														toast({
															title: "Team switched",
															description: `Switched to ${team.team.name} team`,
														});
													}}
													className="text-sm"
												>
													<Avatar className="mr-2 h-5 w-5">
														<AvatarImage
															src={getAvatarUrl(team.team.name, team.team.type)}
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
																: "opacity-0"
														)}
													/>
												</CommandItem>
											))}
									</CommandGroup>
									{/* Other Teams */}
									{teams.filter((t) => t.team.type === "workspace").length > 0 && (
										<CommandGroup heading="Teams">
											{teams
												.filter((t) => t.team.type === "workspace")
												.map((team) => (
													<CommandItem
														key={team.team.id}
														onSelect={() => {
															setActiveTeam(team);
															setOpen(false);
															toast({
																title: "Team switched",
																description: `Switched to ${team.team.name} team`,
															});
														}}
														className="text-sm"
													>
														<Avatar className="mr-2 h-5 w-5">
															<AvatarImage
																src={getAvatarUrl(team.team.name, team.team.type)}
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
																	: "opacity-0"
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
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateTeam}
							disabled={!newTeamName || isLoading}
						>
							Continue
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
