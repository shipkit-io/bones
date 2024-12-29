import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/server/auth";
import {
	ActivityIcon,
	AlertCircle,
	Box,
	Download,
	GitBranch,
	GitPullRequest,
	Globe,
	HardDrive,
	History,
	LineChart,
	Search,
	Settings,
	Shield,
	Star,
	Users,
} from "lucide-react";

// Recent activity type
interface Activity {
	id: string;
	type: "download" | "star" | "fork" | "issue" | "pr" | "release";
	title: string;
	time: string;
	user: {
		name: string;
		avatar: string;
	};
}

// Mock recent activity data
const recentActivity: Activity[] = [
	{
		id: "1",
		type: "download",
		title: "Downloaded v1.2.0",
		time: "2 minutes ago",
		user: {
			name: "Sarah Chen",
			avatar: "/examples/avatars/01.png",
		},
	},
	{
		id: "2",
		type: "star",
		title: "Starred the repository",
		time: "1 hour ago",
		user: {
			name: "Michael Kim",
			avatar: "/examples/avatars/02.png",
		},
	},
	{
		id: "3",
		type: "pr",
		title: "Merged PR #234: Add TypeScript types",
		time: "3 hours ago",
		user: {
			name: "David Singh",
			avatar: "/examples/avatars/03.png",
		},
	},
];

// Activity icon mapping
const activityIcons = {
	download: Download,
	star: Star,
	fork: GitBranch,
	issue: AlertCircle,
	pr: GitPullRequest,
	release: Box,
};

export default async function DashboardPage() {
	const session = await auth();

	if (!session?.user) {
		return null;
	}

	return (
		<div className="container mx-auto py-10 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between space-y-2">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">
						Welcome back, {session.user.name}
					</h2>
					<p className="text-muted-foreground">
						Here's what's happening with your projects
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Button variant="outline" size="sm">
						<Download className="mr-2 h-4 w-4" />
						Download Report
					</Button>
					<Button size="sm">
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</Button>
				</div>
			</div>

			{/* Search */}
			<div className="flex items-center space-x-2">
				<div className="relative flex-1">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search across projects..."
						className="pl-8"
					/>
				</div>
				<Button variant="outline" size="icon">
					<Settings className="h-4 w-4" />
				</Button>
			</div>

			{/* Main Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{/* Stats Cards */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Total Downloads
						</CardTitle>
						<Download className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">45.2k</div>
						<div className="text-xs text-muted-foreground">
							+20.1% from last month
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Active Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">2,350</div>
						<div className="text-xs text-muted-foreground">
							+180.1% from last month
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Active Deployments
						</CardTitle>
						<Globe className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">12,234</div>
						<div className="text-xs text-muted-foreground">
							+19% from last month
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">System Health</CardTitle>
						<ActivityIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">99.9%</div>
						<div className="text-xs text-muted-foreground">
							+0.1% from last week
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs Section */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
					<TabsTrigger value="reports">Reports</TabsTrigger>
					<TabsTrigger value="notifications">Notifications</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
						{/* Main Overview Card */}
						<Card className="col-span-4">
							<CardHeader>
								<CardTitle>System Overview</CardTitle>
								<CardDescription>
									Real-time system metrics and performance
								</CardDescription>
							</CardHeader>
							<CardContent className="pl-2">
								<div className="h-[300px] w-full">
									{/* Add your chart component here */}
									<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
										<span className="text-muted-foreground">
											Chart placeholder
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Recent Activity Card */}
						<Card className="col-span-3">
							<CardHeader>
								<CardTitle>Recent Activity</CardTitle>
								<CardDescription>
									Latest actions across your projects
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-[300px]">
									<div className="space-y-4">
										{recentActivity.map((activity) => {
											const Icon = activityIcons[activity.type];
											return (
												<div key={activity.id} className="flex items-center">
													<Avatar className="h-9 w-9">
														<AvatarImage
															src={activity.user.avatar}
															alt={activity.user.name}
														/>
														<AvatarFallback>
															{activity.user.name
																.split(" ")
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<div className="ml-4 space-y-1">
														<p className="text-sm font-medium leading-none">
															{activity.title}
														</p>
														<p className="text-sm text-muted-foreground">
															{activity.user.name} • {activity.time}
														</p>
													</div>
													<div className="ml-auto">
														<Icon className="h-4 w-4 text-muted-foreground" />
													</div>
												</div>
											);
										})}
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					</div>

					{/* Quick Actions Grid */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium">
									Security Status
								</CardTitle>
								<Shield className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-500">Secure</div>
								<div className="mt-2 flex space-x-2">
									<Badge variant="outline" className="bg-green-50">
										SSL Active
									</Badge>
									<Badge variant="outline" className="bg-green-50">
										2FA Enabled
									</Badge>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium">
									Storage Usage
								</CardTitle>
								<HardDrive className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">75%</div>
								<div className="mt-2">
									<div className="h-2 w-full rounded-full bg-muted">
										<div
											className="h-2 rounded-full bg-primary"
											style={{ width: "75%" }}
										/>
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
								<div className="text-2xl font-bold">89%</div>
								<div className="text-xs text-muted-foreground">
									Of monthly quota
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium">
									Latest Backup
								</CardTitle>
								<History className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">2h ago</div>
								<div className="text-xs text-muted-foreground">
									Next backup in 4h
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Analytics Dashboard</CardTitle>
							<CardDescription>
								Detailed metrics and performance analytics
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[400px] w-full">
								{/* Add your analytics components here */}
								<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
									<span className="text-muted-foreground">
										Analytics dashboard placeholder
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="reports" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Generated Reports</CardTitle>
							<CardDescription>
								View and download system reports
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[400px] w-full">
								{/* Add your reports list here */}
								<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
									<span className="text-muted-foreground">
										Reports section placeholder
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="notifications" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>System Notifications</CardTitle>
							<CardDescription>
								Important alerts and system messages
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[400px] w-full">
								{/* Add your notifications list here */}
								<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
									<span className="text-muted-foreground">
										Notifications section placeholder
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="settings" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Dashboard Settings</CardTitle>
							<CardDescription>
								Customize your dashboard experience
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[400px] w-full">
								{/* Add your settings form here */}
								<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
									<span className="text-muted-foreground">
										Settings section placeholder
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
