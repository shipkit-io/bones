import { HardDrive, History, LineChart, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActions() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Security Status</CardTitle>
					<Shield className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-green-500">Secure</div>
					<div className="mt-2 flex space-x-2">
						<Badge variant="outline" className="">
							SSL Active
						</Badge>
						<Badge variant="outline" className="">
							2FA Enabled
						</Badge>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
					<HardDrive className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold tabular-nums">75%</div>
					<div className="mt-2">
						<div className="h-2 w-full rounded-full bg-muted">
							<div className="h-2 rounded-full bg-primary" style={{ width: "75%" }} />
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">API Usage</CardTitle>
					<LineChart className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold tabular-nums">89%</div>
					<div className="text-xs text-muted-foreground">Of monthly quota</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Latest Backup</CardTitle>
					<History className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold tabular-nums">2h ago</div>
					<div className="text-xs text-muted-foreground">Next backup in 4h</div>
				</CardContent>
			</Card>
		</div>
	);
}
