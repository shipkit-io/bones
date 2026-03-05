"use client";

import { CheckCircle, Database, ExternalLink, Loader2, XCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link } from "@/components/primitives/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
	CategorizedIntegrationStatuses, // Assuming these are exported from service
	IntegrationStatus,
} from "@/server/services/integration-service";
import { seedCMSAction } from "./actions"; // Import the seed action

interface IntegrationsClientContentProps {
	categorizedIntegrations: CategorizedIntegrationStatuses;
}

// Modified to handle the PayloadCMS card specially with seeding functionality
const renderIntegrationCard = (status: IntegrationStatus) => {
	// Special handling for Payload CMS to include seeding functionality
	if (status.name === "Payload CMS" && status.configured) {
		return <PayloadCMSCard status={status} />;
	}

	// Standard card for all other integrations
	return (
		<Card key={status.name} className="flex flex-col">
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					{status.name}
					<Badge variant={status.enabled ? "default" : "destructive"}>
						{status.enabled ? "Enabled" : "Disabled"}
					</Badge>
				</CardTitle>
				<CardDescription>Configuration Status</CardDescription>
			</CardHeader>
			<CardContent className="flex-grow flex flex-col justify-between">
				<div className="mb-4 flex items-start space-x-2 text-sm break-all">
					{status.configured ? (
						<CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
					) : (
						<XCircle className="h-4 w-4 mt-0.5 text-red-600 flex-shrink-0" />
					)}
					<p className="text-muted-foreground">{status.message}</p>
				</div>
				{status.adminUrl && (
					<Link
						href={status.adminUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto w-full")}
					>
						Go to {status.name}
						<ExternalLink className="ml-2 h-4 w-4" />
					</Link>
				)}
			</CardContent>
		</Card>
	);
};

// Special PayloadCMS card that includes seeding functionality
const PayloadCMSCard: React.FC<{ status: IntegrationStatus }> = ({ status }) => {
	const [seedLoading, setSeedLoading] = useState(false);
	const [seedMessage, setSeedMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

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

	return (
		<Card key={status.name} className="flex flex-col">
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					{status.name}
					<Badge variant={status.enabled ? "default" : "destructive"}>
						{status.enabled ? "Enabled" : "Disabled"}
					</Badge>
				</CardTitle>
				<CardDescription>Configuration Status</CardDescription>
			</CardHeader>
			<CardContent className="flex-grow flex flex-col justify-between space-y-4">
				<div className="flex items-start space-x-2 text-sm">
					{status.configured ? (
						<CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
					) : (
						<XCircle className="h-4 w-4 mt-0.5 text-red-600 flex-shrink-0" />
					)}
					<p className="text-muted-foreground">{status.message}</p>
				</div>

				<div className="space-y-3 pt-2">
					{/* Admin link */}
					{status.adminUrl && (
						<Link
							href={status.adminUrl}
							target="_blank"
							rel="noopener noreferrer"
							className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
						>
							Open Admin
							<ExternalLink className="ml-2 h-4 w-4" />
						</Link>
					)}

					{/* Seed CMS button */}
					<form onSubmit={handleSeed} className="space-y-2 mt-1">
						<Button
							type="submit"
							disabled={seedLoading || !status.configured}
							variant="secondary"
							size="sm"
							className="w-full"
						>
							{seedLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Seeding...
								</>
							) : (
								<>
									<Database className="mr-2 h-4 w-4" />
									Seed CMS Data
								</>
							)}
						</Button>
					</form>

					{/* Seed result message */}
					{seedMessage && (
						<Alert
							variant={seedMessage.type === "success" ? "default" : "destructive"}
							className="text-sm mt-2"
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
				</div>
			</CardContent>
		</Card>
	);
};

export const IntegrationsClientContent: React.FC<IntegrationsClientContentProps> = ({
	categorizedIntegrations,
}) => {
	return (
		<div className="space-y-10">
			{Object.entries(categorizedIntegrations).map(
				([category, integrations]) =>
					integrations.length > 0 && (
						<section key={category}>
							<h2 className="text-xl font-semibold tracking-tight mb-4">{category}</h2>
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{integrations.map((integration) => renderIntegrationCard(integration))}
							</div>
							<Separator className="my-8" />
						</section>
					)
			)}
		</div>
	);
};
