import { ActivityIcon, Download, Globe, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
	totalDownloads?: number;
	activeUsers?: number;
	activeDeployments?: number;
	systemHealth?: number;
}

export function StatsCards({
	totalDownloads = 0,
	activeUsers = 0,
	activeDeployments = 0,
	systemHealth = 0,
}: StatsCardsProps) {
	const stats = [
		{
			title: "Total Downloads",
			value: totalDownloads.toLocaleString(),
			Icon: Download,
		},
		{
			title: "Active Users",
			value: activeUsers.toLocaleString(),
			Icon: Users,
		},
		{
			title: "Active Deployments",
			value: activeDeployments.toLocaleString(),
			Icon: Globe,
		},
		{
			title: "System Health",
			value: systemHealth > 0 ? `${systemHealth}%` : "—",
			Icon: ActivityIcon,
		},
	];

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => (
				<Card key={stat.title}>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
						<stat.Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tabular-nums">{stat.value}</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
