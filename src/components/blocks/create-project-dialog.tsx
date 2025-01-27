"use client";

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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createProject } from "@/server/actions/projects";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Team {
	id: string;
	name: string;
}

interface CreateProjectDialogProps {
	teams: Team[];
}

export function CreateProjectDialog({ teams }: CreateProjectDialogProps) {
	const [open, setOpen] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		await createProject(formData);
		setOpen(false);
		router.refresh();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<Plus className="h-4 w-4" />
					<span className="sr-only">Create Project</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Project</DialogTitle>
					<DialogDescription>
						Create a new project to organize your work.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Input
							id="name"
							name="name"
							placeholder="Project name"
							required
							autoComplete="off"
						/>
					</div>
					<div className="space-y-2">
						<Select name="teamId">
							<SelectTrigger>
								<SelectValue placeholder="Select a team" />
							</SelectTrigger>
							<SelectContent>
								{teams.map((team) => (
									<SelectItem key={team.id} value={team.id}>
										{team.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button type="submit">Create Project</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
