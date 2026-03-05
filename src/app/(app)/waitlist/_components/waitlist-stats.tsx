import { Clock, Users, Zap } from "lucide-react";
import { getWaitlistStats } from "@/server/services/waitlist-service";

export async function WaitlistStats() {
	const stats = await getWaitlistStats();

	return (
		<div className="mb-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
			<div className="flex items-center gap-2">
				<Users className="h-4 w-4 text-primary" />
				<span>
					<strong className="tabular-nums">{stats.total.toLocaleString()}</strong> developers waiting
				</span>
			</div>
			<div className="flex items-center gap-2">
				<Clock className="h-4 w-4 text-primary" />
				<span>
					Launch in <strong>Q1 2025</strong>
				</span>
			</div>
			<div className="flex items-center gap-2">
				<Zap className="h-4 w-4 text-primary" />
				<span>
					<strong>10x</strong> faster development
				</span>
			</div>
		</div>
	);
}
