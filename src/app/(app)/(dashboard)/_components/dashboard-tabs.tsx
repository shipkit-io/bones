import { Link } from "@/components/primitives/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeWindow } from "@/components/ui/code-window";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";

const installationCode = `# Clone the repository
git clone ${siteConfig.repo.url}

# Change directory
cd ${siteConfig.branding.projectSlug}

# Install dependencies
bun install --frozen-lockfile

# Start the development server
bun dev`;

const dockerCode = `# Clone the repository
git clone ${siteConfig.repo.url}

# Change directory
cd ${siteConfig.branding.projectSlug}

# Build the Docker image
docker build -t ${siteConfig.branding.projectSlug} .

# Run the container
docker run -p 3000:3000 ${siteConfig.branding.projectSlug}`;

export function DashboardTabs({ hasGitHubConnection }: { hasGitHubConnection: boolean }) {
	return (
		<Tabs defaultValue="overview" className="space-y-4">
			<TabsList>
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="downloads">Downloads</TabsTrigger>
				<TabsTrigger value="analytics">Analytics</TabsTrigger>
				<TabsTrigger value="reports">Reports</TabsTrigger>
				<TabsTrigger value="notifications">Notifications</TabsTrigger>
				<TabsTrigger value="settings">Settings</TabsTrigger>
			</TabsList>

			<TabsContent value="overview" className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
					<Card className="col-span-4">
						<CardHeader>
							<CardTitle>System Overview</CardTitle>
							<CardDescription>Real-time system metrics and performance</CardDescription>
						</CardHeader>
						<CardContent className="pl-2">
							<div className="h-[300px] w-full">
								<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
									<span className="text-muted-foreground">Chart placeholder</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="downloads" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Download {siteConfig.title}</CardTitle>
						<CardDescription>
							Download the latest version of {siteConfig.title} directly, or connect your GitHub
							account to get automatic updates, features, and support!
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-4">
							{hasGitHubConnection && (
								<>
									<div className="space-y-4">
										<div className="prose dark:prose-invert">
											<h3>Quick Install</h3>
											<span className="block">
												Clone the repository with{" "}
												<CodeWindow
													code={`git clone ${siteConfig.repo.url}`}
													language="bash"
													variant="single"
													showLineNumbers={false}
												/>
												then install dependencies with{" "}
												<CodeWindow
													code="bun install --frozen-lockfile"
													language="bash"
													variant="single"
													showLineNumbers={false}
												/>
											</span>
										</div>

										<div className="rounded-lg border bg-card p-4">
											<h3 className="mb-3 text-lg font-semibold">Full Installation Steps</h3>
											<CodeWindow
												title="Terminal"
												code={installationCode}
												language="bash"
												showLineNumbers={false}
												theme="dark"
												variant="minimal"
											/>
										</div>

										<div className="rounded-lg border bg-card p-4">
											<h3 className="mb-3 text-lg font-semibold">Using Docker</h3>
											<CodeWindow
												title="Terminal"
												code={dockerCode}
												language="bash"
												showLineNumbers={false}
												theme="dark"
												variant="minimal"
											/>
										</div>
									</div>
								</>
							)}

							{!hasGitHubConnection && (
								<div className="text-sm text-muted-foreground">
									<p>Connect GitHub to:</p>
									<ul className="mt-2 list-inside list-disc">
										<li>Access the repository directly</li>
										<li>Get automatic updates</li>
										<li>Access GitHub support</li>
									</ul>
								</div>
							)}

							<p className="mt-4 text-sm text-muted-foreground">
								Need help? Check out our{" "}
								<Link href={routes.docs} className="underline">
									documentation
								</Link>{" "}
								or{" "}
								<Link href={routes.contact} className="underline">
									contact support
								</Link>
								.
							</p>
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="analytics" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Analytics Dashboard</CardTitle>
						<CardDescription>Detailed metrics and performance analytics</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[400px] w-full">
							<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
								<span className="text-muted-foreground">Analytics dashboard placeholder</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="reports" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Generated Reports</CardTitle>
						<CardDescription>View and download system reports</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[400px] w-full">
							<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
								<span className="text-muted-foreground">Reports section placeholder</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="notifications" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>System Notifications</CardTitle>
						<CardDescription>Important alerts and system messages</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[400px] w-full">
							<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
								<span className="text-muted-foreground">Notifications section placeholder</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="settings" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Dashboard Settings</CardTitle>
						<CardDescription>Customize your dashboard experience</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[400px] w-full">
							<div className="flex h-full items-center justify-center rounded-md border-2 border-dashed">
								<span className="text-muted-foreground">Settings section placeholder</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
