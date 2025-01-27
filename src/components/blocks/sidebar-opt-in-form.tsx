"use client";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DismissibleCard } from "@/components/ui/dismissible-card";
import { SidebarInput } from "@/components/ui/sidebar";
import { LOCAL_STORAGE_KEYS } from "@/config/local-storage-keys";
import { useToast } from "@/hooks/use-toast";
import { addAudienceUser } from "@/server/actions/resend-actions";

export const SidebarOptInForm = () => {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const { toast } = useToast();

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setStatus("loading");

		try {
			const result = await addAudienceUser(email);

			if (result.success) {
				setStatus("success");
				setEmail("");
				toast({
					title: "Subscribed!",
					description: "You've been successfully subscribed to our newsletter.",
				});
			} else {
				console.error("Error adding contact:", result.error);
				setStatus("error");
				toast({
					title: "Subscription failed",
					description: result.error || "Failed to subscribe. Please try again.",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error submitting form:", error);
			setStatus("error");
			toast({
				title: "Subscription failed",
				description: "An unexpected error occurred. Please try again.",
				variant: "destructive",
			});
		} finally {
			// Reset status after a delay to remove the inline message
			setTimeout(() => {
				setStatus("idle");
			}, 3000);
		}
	};

	return (
		<DismissibleCard
			storageKey={LOCAL_STORAGE_KEYS.sidebarOptInFormDismissed}
			className="shadow-none"
		>
			<form onSubmit={handleSubmit}>
				<CardHeader className="p-4 pb-0">
					<CardTitle className="text-sm">Subscribe to our newsletter</CardTitle>
					<CardDescription>
						Opt-in to receive updates and news about the sidebar.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-2.5 p-4">
					<SidebarInput
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<Button disabled={status === "loading"}>
						{status === "loading" ? "Subscribing..." : "Subscribe"}
					</Button>
				</CardContent>
			</form>
		</DismissibleCard>
	);
};
