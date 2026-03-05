import { Code, Download, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CliPage() {
	return (
		<div className="max-w-4xl mx-auto space-y-8">
			<div className="text-center space-y-4">
				<h1 className="text-4xl font-bold">Bones CLI</h1>
				<p className="text-xl text-muted-foreground">
					A powerful command-line interface for scaffolding modern web applications
				</p>
				<Badge variant="secondary">Coming Soon</Badge>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Terminal className="h-5 w-5" />
							Quick Setup
						</CardTitle>
						<CardDescription>Get started in seconds with our streamlined CLI</CardDescription>
					</CardHeader>
					<CardContent>
						<pre className="bg-muted p-3 rounded-md text-sm">
							<code>npx create-shipkit-app@latest</code>
						</pre>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Download className="h-5 w-5" />
							Component Library
						</CardTitle>
						<CardDescription>Add pre-built components to your project</CardDescription>
					</CardHeader>
					<CardContent>
						<pre className="bg-muted p-3 rounded-md text-sm">
							<code>bones add button card form</code>
						</pre>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Code className="h-5 w-5" />
							Code Generation
						</CardTitle>
						<CardDescription>Generate boilerplate code automatically</CardDescription>
					</CardHeader>
					<CardContent>
						<pre className="bg-muted p-3 rounded-md text-sm">
							<code>bones generate page api auth</code>
						</pre>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Installation</CardTitle>
					<CardDescription>Install the CLI globally to use it anywhere</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="font-medium mb-2">NPM</h3>
						<pre className="bg-muted p-3 rounded-md text-sm">
							<code>npm install -g bones-cli</code>
						</pre>
					</div>
					<div>
						<h3 className="font-medium mb-2">Yarn</h3>
						<pre className="bg-muted p-3 rounded-md text-sm">
							<code>yarn global add bones-cli</code>
						</pre>
					</div>
					<div>
						<h3 className="font-medium mb-2">Bun</h3>
						<pre className="bg-muted p-3 rounded-md text-sm">
							<code>bun add --global bones-cli</code>
						</pre>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
