import { ExternalLink, Globe, Shield, Zap } from "lucide-react";
import { PrivateRepoDeployButton } from "@/components/modules/deploy/private-repo-deploy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VercelDeployExample() {
	return (
		<div className="max-w-4xl mx-auto space-y-8">
			<div className="text-center space-y-4">
				<h1 className="text-4xl font-bold">Vercel Deployment</h1>
				<p className="text-xl text-muted-foreground">
					Deploy your application to Vercel with zero configuration
				</p>
				<Badge variant="secondary">Example</Badge>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Zap className="h-5 w-5" />
							Instant Deployment
						</CardTitle>
						<CardDescription>Deploy in seconds with automatic builds</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Connect your repository and deploy instantly with automatic CI/CD pipeline.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5" />
							Edge Network
						</CardTitle>
						<CardDescription>Global CDN for optimal performance</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Automatically distributed across the globe for the fastest possible loading times.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Globe className="h-5 w-5" />
							Custom Domains
						</CardTitle>
						<CardDescription>Use your own domain with SSL</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Easily configure custom domains with automatic SSL certificate provisioning.
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Deploy to Vercel</CardTitle>
					<CardDescription>
						Click the button below to deploy this application to Vercel
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<PrivateRepoDeployButton />
					<Button asChild className="w-full">
						<a
							href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flacymorrow%2Fshipkit"
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLink className="h-4 w-4 mr-2" />
							Deploy to Vercel
						</a>
					</Button>
					<div className="text-sm text-muted-foreground space-y-2">
						<p>
							<strong>Note:</strong> Make sure to configure your environment variables after
							deployment.
						</p>
						<p>
							This will create a new project in your Vercel dashboard and automatically deploy the
							latest version.
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Manual Deployment</CardTitle>
					<CardDescription>Deploy manually using the Vercel CLI</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="font-medium mb-2">1. Install Vercel CLI</h3>
						<pre className="bg-muted p-3 rounded-md text-sm">
							<code>npm install -g vercel</code>
						</pre>
					</div>
					<div>
						<h3 className="font-medium mb-2">2. Deploy</h3>
						<pre className="bg-muted p-3 rounded-md text-sm">
							<code>vercel --prod</code>
						</pre>
					</div>
					<div>
						<h3 className="font-medium mb-2">3. Follow the prompts</h3>
						<p className="text-sm text-muted-foreground">
							The CLI will guide you through the deployment process and configuration.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
