"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { deleteApiKey } from "@/server/actions/api-key-actions";

interface DeleteApiKeyDialogProps {
	apiKeyId: string;
	triggerProps?: ButtonProps;
}

export const DeleteApiKeyDialog = ({ apiKeyId, triggerProps }: DeleteApiKeyDialogProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleDelete = async () => {
		try {
			setIsLoading(true);
			const success = await deleteApiKey(apiKeyId);
			if (success) {
				toast.success("API key deleted successfully");
				setIsOpen(false);
			} else {
				toast.error("Failed to delete API key");
			}
		} catch (error) {
			toast.error("Failed to delete API key");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="ghost" size="icon" className="hover:text-red-600" {...triggerProps}>
					<Trash2 className="h-4 w-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete API Key</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this API key? This action cannot be undone and any
						applications using this key will stop working immediately.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<form action={handleDelete}>
						<AlertDialogAction
							type="submit"
							className="bg-red-600 hover:bg-red-700 text-white"
							disabled={isLoading}
						>
							{isLoading ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</form>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
