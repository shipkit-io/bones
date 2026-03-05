"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { updateSettings } from "@/server/actions/settings";

const themes = [
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;

type Theme = (typeof themes)[number]["value"];

export default function AppearancePage() {
	const [isPending, startTransition] = React.useTransition();
	const { theme, setTheme } = useTheme();

	async function handleThemeChange(newTheme: Theme) {
		if (isPending) return;

		startTransition(async () => {
			try {
				const result = await updateSettings({
					theme: newTheme,
				});

				if (!result.success) {
					toast.error(result.error ?? "Failed to update appearance");
					return;
				}

				setTheme(newTheme);
				toast.success(result.message);
			} catch (error) {
				console.error("Theme update error:", error);
				toast.error("An unexpected error occurred");
			}
		});
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Appearance</h3>
				<p className="text-sm text-muted-foreground">
					Customize how the application looks and feels.
				</p>
			</div>
			<Separator />
			<Card>
				<CardHeader>
					<CardTitle>Theme</CardTitle>
					<CardDescription>Choose your preferred theme for the application.</CardDescription>
				</CardHeader>
				<CardContent>
					<RadioGroup
						defaultValue={theme ?? "system"}
						onValueChange={(value) => handleThemeChange(value as Theme)}
						className="grid grid-cols-3 gap-4"
						disabled={isPending}
					>
						{themes.map((theme) => (
							<div key={theme.value}>
								<RadioGroupItem
									value={theme.value}
									id={theme.value}
									className="peer sr-only"
									disabled={isPending}
								/>
								<Label
									htmlFor={theme.value}
									className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
								>
									<span>{theme.label}</span>
								</Label>
							</div>
						))}
					</RadioGroup>
				</CardContent>
			</Card>
		</div>
	);
}
