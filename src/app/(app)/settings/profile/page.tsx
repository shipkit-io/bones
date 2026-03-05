"use client";

import { useSession } from "next-auth/react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TextMorph } from "@/components/ui/text-morph";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/server/actions/settings";

interface ProfileFormData {
	name: string;
	bio: string;
}

export default function SettingsPage() {
	const [isPending, startTransition] = React.useTransition();
	const { data: session, status, update: updateSession } = useSession();
	const [formData, setFormData] = React.useState<ProfileFormData>({
		name: "",
		bio: "",
	});

	// Set initial form data from session
	React.useEffect(() => {
		if (session?.user) {
			const initialData = {
				name: session.user.name ?? "",
				bio: session.user.bio ?? "",
			};
			setFormData(initialData);
		}
	}, [session?.user]);

	// Handle form input changes
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	function onSubmit(formData: FormData) {
		const data = {
			name: formData.get("name") as string,
			bio: formData.get("bio") as string,
		};

		// Basic validation
		if (!data.name?.trim()) {
			toast.error("Name is required");
			return;
		}

		startTransition(async () => {
			try {
				const result = await updateProfile({
					name: data.name.trim(),
					bio: data.bio?.trim() ?? null,
				});

				if (!result.success) {
					toast.error(result.error ?? "Failed to update profile");
					return;
				}

				// Update session with new values
				await updateSession({
					name: data.name.trim(),
					bio: data.bio?.trim() ?? null,
				});

				toast.success(result.message);
			} catch (error) {
				console.error("Profile update error:", error);
				toast.error("An unexpected error occurred");
			}
		});
	}

	// Show loading state while session is loading
	if (status === "loading") {
		return (
			<div className="animate-pulse space-y-6">
				<div>
					<div className="h-6 w-32 rounded bg-muted" />
					<div className="mt-2 h-4 w-64 rounded bg-muted" />
				</div>
				<Separator />
				<Card>
					<CardHeader>
						<div className="h-6 w-48 rounded bg-muted" />
						<div className="mt-2 h-4 w-96 rounded bg-muted" />
					</CardHeader>
					<CardContent className="space-y-6">
						{[1, 2].map((i) => (
							<div key={i} className="space-y-2">
								<div className="h-4 w-24 rounded bg-muted" />
								<div className="h-10 w-full rounded bg-muted" />
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-2xl font-medium">
					<TextMorph className="">{formData.name || "Profile"}</TextMorph>
				</h3>
				<p className="text-sm text-muted-foreground">
					This is how others will see you on the site.
				</p>
			</div>
			<Separator />
			<form action={onSubmit}>
				<Card>
					<CardHeader>
						<CardTitle>General Information</CardTitle>
						<CardDescription>Update your personal information.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								name="name"
								placeholder="Your name"
								value={formData.name}
								onChange={handleChange}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="bio">Bio</Label>
							<Textarea
								id="bio"
								name="bio"
								placeholder="Tell us about yourself"
								value={formData.bio}
								onChange={handleChange}
							/>
						</div>
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Saving..." : "Save Changes"}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}
