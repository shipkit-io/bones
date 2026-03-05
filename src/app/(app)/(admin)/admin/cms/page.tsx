"use client";

import { CheckCircle, Database, ExternalLink, Loader2, Terminal, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getCMSStatusAction, seedCMSAction } from "@/app/(app)/(admin)/admin/integrations/actions";
import { Link } from "@/components/primitives/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { routes } from "@/config/routes";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CMSStatus {
	configured: boolean;
	message: string;
}

export default function CMSPage() {
	const [seedLoading, setSeedLoading] = useState(false);
	const [seedMessage, setSeedMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const [cmsStatus, setCmsStatus] = useState<CMSStatus | null>(null);
	const [statusLoading, setStatusLoading] = useState(true);

	useEffect(() => {
		async function fetchStatus() {
			setStatusLoading(true);
			try {
				const status = await getCMSStatusAction();
				setCmsStatus(status);
			} catch (error) {
				console.error("Error fetching CMS status:", error);
				setCmsStatus({
					configured: false,
					message: error instanceof Error ? error.message : "Error checking status",
				});
			} finally {
				setStatusLoading(false);
			}
		}
		void fetchStatus();
	}, []);

	const handleSeed = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setSeedLoading(true);
			setSeedMessage(null);

			const result = await seedCMSAction();

			setSeedMessage({
				type: result.success ? "success" : "error",
				text: result.message,
			});
		} catch (error) {
			setSeedMessage({
				type: "error",
				text: error instanceof Error ? error.message : "An error occurred",
			});
		} finally {
			setSeedLoading(false);
		}
	};

	const renderStatusAlert = () => {
		if (statusLoading) {
			return (
				<Alert>
					<Loader2 className="h-4 w-4 animate-spin" />
					<AlertTitle>Loading Status</AlertTitle>
					<AlertDescription>Checking CMS configuration...</AlertDescription>
				</Alert>
			);
		}

		if (!cmsStatus) {
			return (
				<Alert variant="destructive">
					<XCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>Could not load CMS status.</AlertDescription>
				</Alert>
			);
		}

		return (
			<Alert variant={cmsStatus.configured ? "default" : "destructive"}>
				{cmsStatus.configured ? (
					<CheckCircle className="h-4 w-4" />
				) : (
					<XCircle className="h-4 w-4" />
				)}
				<AlertTitle>
					{cmsStatus.configured ? "CMS Configured & Enabled" : "CMS Not Fully Configured"}
				</AlertTitle>
				<AlertDescription>{cmsStatus.message}</AlertDescription>
			</Alert>
		);
	};

	return (
		<div className="container mx-auto max-w-3xl py-10 space-y-8">
			<h1 className="text-3xl font-bold tracking-tight">CMS Management</h1>

			<Card>
				<CardHeader>
					<CardTitle>Configuration Status</CardTitle>
					<CardDescription>
						Current status based on environment variables and feature flags.
					</CardDescription>
				</CardHeader>
				<CardContent>{renderStatusAlert()}</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Actions</CardTitle>
					<CardDescription>Manage your Payload CMS instance.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-6 sm:grid-cols-2">
					<div className="flex flex-col space-y-2">
						<h3 className="font-semibold">Payload Admin</h3>
						<p className="text-sm text-muted-foreground">
							Access the full Payload CMS admin interface.
						</p>
						<Link
							target="_blank"
							rel="noopener noreferrer"
							className={cn(buttonVariants({ variant: "outline" }), "mt-auto")}
							href={routes.cms.index}
						>
							Open Payload Admin
							<ExternalLink className="ml-2 h-4 w-4" />
						</Link>
					</div>

					<div className="flex flex-col space-y-2">
						<h3 className="font-semibold">Seed CMS Data</h3>
						<p className="text-sm text-muted-foreground">
							Populate the CMS with initial data. Clears existing data first. (Requires admin
							privileges)
						</p>
						<form onSubmit={handleSeed} className="mt-auto space-y-2">
							<Button
								type="submit"
								disabled={seedLoading || !cmsStatus?.configured}
								className="w-full"
							>
								{seedLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Database className="mr-2 h-4 w-4" />
								)}
								{seedLoading ? "Seeding..." : "Seed CMS"}
							</Button>
							{seedMessage && (
								<Alert
									variant={seedMessage.type === "success" ? "default" : "destructive"}
									className="text-sm"
								>
									{seedMessage.type === "success" ? (
										<CheckCircle className="h-4 w-4" />
									) : (
										<XCircle className="h-4 w-4" />
									)}
									<AlertTitle>{seedMessage.type === "success" ? "Success" : "Error"}</AlertTitle>
									<AlertDescription>{seedMessage.text}</AlertDescription>
								</Alert>
							)}
						</form>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
