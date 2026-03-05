import { formatDistanceToNow } from "date-fns";
import { Clock, Mail, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	getWaitlistEntries,
	getWaitlistStats,
} from "@/server/services/waitlist-service";

export async function WaitlistAdmin() {
	const [stats, entries] = await Promise.all([
		getWaitlistStats(),
		getWaitlistEntries({ limit: 100 }),
	]);

	return (
		<div className="space-y-8">
			{/* Statistics Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Signups</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.total.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							People on the waitlist
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Notified</CardTitle>
						<Mail className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.notified.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							Users already notified
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Pending</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.pending.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							Awaiting notification
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Waitlist Entries */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Recent Waitlist Entries
					</CardTitle>
					<CardDescription>
						Latest signups with their project details
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{entries.length === 0 ? (
							<p className="text-center text-muted-foreground py-8">
								No waitlist entries yet
							</p>
						) : (
							entries.map((entry) => (
								<div
									key={entry.id}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<span className="font-medium">{entry.name}</span>
											<span className="text-sm text-muted-foreground">
												{entry.email}
											</span>
											{entry.isNotified && (
												<Badge variant="secondary" className="text-xs">
													Notified
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											{entry.company && <span>🏢 {entry.company}</span>}
											{entry.role && <span>👤 {entry.role}</span>}
											{entry.projectType && <span>🚀 {entry.projectType}</span>}
											{entry.timeline && <span>⏰ {entry.timeline}</span>}
										</div>
										{entry.interests && (
											<p className="text-sm text-muted-foreground max-w-2xl">
												💭 {entry.interests}
											</p>
										)}
									</div>
									<div className="text-right text-sm text-muted-foreground">
										<div>{formatDistanceToNow(entry.createdAt)} ago</div>
										<div className="text-xs">via {entry.source}</div>
									</div>
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
