"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CreateApiKeyDialogProps {
	onSubmit: (data: {
		userId: string;
		name: string;
		description?: string;
		expiresIn?: string;
	}) => Promise<{ key?: string }>;
	userId: string;
}

export function CreateApiKeyDialog({ onSubmit, userId }: CreateApiKeyDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [expiresIn, setExpiresIn] = React.useState<string>();
	const [isLoading, setIsLoading] = React.useState(false);
	const [createdKey, setCreatedKey] = React.useState<string | null>(null);
	const [showKeyDialog, setShowKeyDialog] = React.useState(false);
	const { toast } = useToast();

	const resetForm = () => {
		setName("");
		setDescription("");
		setExpiresIn(undefined);
		setCreatedKey(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const result = await onSubmit({
				userId,
				name,
				description,
				expiresIn,
			});

			if (result.key) {
				// Copy to clipboard
				await navigator.clipboard.writeText(result.key);
				toast({
					title: "API key created",
					description: "The API key has been copied to your clipboard.",
				});

				// Store the key and show the key dialog
				setCreatedKey(result.key);
				setShowKeyDialog(true);
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to create API key. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleCloseKeyDialog = () => {
		setShowKeyDialog(false);
		setOpen(false);
		resetForm();
	};

	return (
		<>
			<Dialog
				open={open && !showKeyDialog}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (!isOpen) resetForm();
				}}
			>
				<DialogTrigger asChild>
					<Button>
						<PlusIcon className="mr-2 h-4 w-4" /> Create API Key
					</Button>
				</DialogTrigger>
				<DialogContent>
					<form onSubmit={handleSubmit}>
						<DialogHeader>
							<DialogTitle>Create API Key</DialogTitle>
							<DialogDescription>
								Create a new API key to access the API. Keep this key secure and never share it
								publicly.
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="My API Key"
									required
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Optional description for this API key"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="expires">Expires</Label>
								<Select value={expiresIn} onValueChange={setExpiresIn}>
									<SelectTrigger id="expires">
										<SelectValue placeholder="Never" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="7">7 days</SelectItem>
										<SelectItem value="30">30 days</SelectItem>
										<SelectItem value="90">90 days</SelectItem>
										<SelectItem value="365">1 year</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setOpen(false)} type="button">
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Creating..." : "Create"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog to display the created API key */}
			<Dialog open={showKeyDialog} onOpenChange={handleCloseKeyDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>API Key Created</DialogTitle>
						<DialogDescription>
							Your API key has been created successfully. This is the only time you will see the
							full key. Please copy it now.
						</DialogDescription>
					</DialogHeader>

					<div className="py-4">
						<Alert className="mb-4">
							<AlertDescription>
								Make sure to copy your API key now. You won't be able to see it again.
							</AlertDescription>
						</Alert>

						<div className="flex items-center space-x-2 bg-muted p-3 rounded-md">
							<code className="flex-1 font-mono text-sm break-all">{createdKey}</code>
							<CopyButton value={createdKey || ""} />
						</div>
					</div>

					<DialogFooter>
						<Button onClick={handleCloseKeyDialog}>Done</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
