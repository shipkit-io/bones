"use client";

import { AlertCircle, CheckCircle, Zap } from "lucide-react";
import { VercelConnectButton } from "@/components/buttons/vercel-connect-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types/user";

interface VercelConnectionCardProps {
	hasVercelConnection: boolean;
	user: User;
}

export const VercelConnectionCard = ({ hasVercelConnection, user }: VercelConnectionCardProps) => {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<Zap className="h-5 w-5" />
					Vercel Integration
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{hasVercelConnection ? (
					<>
						<div className="flex items-center gap-2">
							<CheckCircle className="h-4 w-4 text-green-500" />
							<span className="text-sm">Connected and ready</span>
							<Badge variant="default" className="text-xs">
								Connected
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground">
							Your Vercel account is connected. Projects will be created automatically.
						</p>
					</>
				) : (
					<>
						<div className="flex items-center gap-2">
							<AlertCircle className="h-4 w-4 text-orange-500" />
							<span className="text-sm">Connection required</span>
							<Badge variant="outline" className="text-xs">
								Not Connected
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground">
							Connect your Vercel account to enable automatic project creation.
						</p>
						<VercelConnectButton user={user} isConnected={hasVercelConnection} />
					</>
				)}
			</CardContent>
		</Card>
	);
};
