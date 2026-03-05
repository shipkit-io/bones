"use client";

import { ArrowRight, CheckCircle, Coffee, Gift, Heart, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addToWaitlist, type WaitlistFormData } from "@/server/actions/waitlist-actions";

export function WaitlistForm() {
	const [formData, setFormData] = useState<WaitlistFormData>({
		email: "",
		name: "",
		company: "",
		role: "",
		projectType: "",
		timeline: "",
		interests: "",
	});
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const { toast } = useToast();

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setStatus("loading");

		try {
			const result = await addToWaitlist(formData);

			if (result.success) {
				setStatus("success");
				setFormData({
					email: "",
					name: "",
					company: "",
					role: "",
					projectType: "",
					timeline: "",
					interests: "",
				});
				toast({
					title: "You're officially on the list! 🎉",
					description: "We'll send you updates and early access when it's ready.",
				});
			} else {
				console.error("Error adding to waitlist:", result.error);
				setStatus("error");
				toast({
					title: "Something went wrong",
					description: result.error || "Please try again or contact support.",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error submitting form:", error);
			setStatus("error");
			toast({
				title: "Something went wrong",
				description: "Please try again or contact support if the issue persists.",
				variant: "destructive",
			});
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	if (status === "success") {
		return (
			<div className="py-24 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
				<div className="container px-4 md:px-6">
					<div className="mx-auto max-w-2xl text-center">
						<div className="relative">
							<div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25" />
							<Card className="relative border-green-200 dark:border-green-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
								<CardContent className="p-12">
									<div className="mb-6 flex justify-center">
										<div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
											<CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
										</div>
									</div>
									<h3 className="mb-4 text-3xl font-bold text-green-900 dark:text-green-100">
										Welcome to the club! 🚀
									</h3>
									<p className="mb-8 text-green-700 dark:text-green-300 text-lg">
										You're now part of an exclusive group of developers who are tired of building
										the same things over and over. We'll keep you updated on our progress and give
										you first access when we launch.
									</p>
									<div className="grid gap-6 sm:grid-cols-2">
										<div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
											<Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
											<div>
												<div className="font-semibold text-green-900 dark:text-green-100">
													50% OFF Forever
												</div>
												<div className="text-sm text-green-700 dark:text-green-300">
													Early access pricing locked in
												</div>
											</div>
										</div>
										<div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
											<Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
											<div>
												<div className="font-semibold text-green-900 dark:text-green-100">
													First Access
												</div>
												<div className="text-sm text-green-700 dark:text-green-300">
													Before public launch
												</div>
											</div>
										</div>
									</div>
									<div className="mt-8 pt-6 border-t border-green-200 dark:border-green-800">
										<p className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
											<Heart className="h-4 w-4" />
											Thanks for believing in what we're building
											<Coffee className="h-4 w-4" />
										</p>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="py-24 bg-white dark:bg-slate-950">
			<div className="container px-4 md:px-6">
				<div className="mx-auto max-w-2xl">
					<div className="text-center mb-12">
						<Badge
							variant="outline"
							className="mb-4 border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-300"
						>
							Join the Movement
						</Badge>
						<h2 className="mb-6 text-3xl md:text-4xl font-bold tracking-tight">Get Early Access</h2>
						<p className="text-lg text-slate-600 dark:text-slate-300">
							Help us build something developers actually want. Your input shapes what we ship.
						</p>
					</div>

					<div className="relative">
						<div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl blur opacity-20" />
						<Card className="relative border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
							<CardHeader className="text-center">
								<CardTitle className="flex items-center justify-center gap-2">
									<Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
									Early Access Application
								</CardTitle>
								<CardDescription>
									Just a few questions to help us prioritize features and make sure Shipkit fits
									your needs.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="name">Name *</Label>
											<Input
												id="name"
												type="text"
												placeholder="Your full name"
												value={formData.name}
												onChange={(e) => handleInputChange("name", e.target.value)}
												required
												disabled={status === "loading"}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="email">Email *</Label>
											<Input
												id="email"
												type="email"
												placeholder="your@email.com"
												value={formData.email}
												onChange={(e) => handleInputChange("email", e.target.value)}
												required
												disabled={status === "loading"}
											/>
										</div>
									</div>

									<div className="grid gap-4 sm:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="company">Company</Label>
											<Input
												id="company"
												type="text"
												placeholder="Your company name"
												value={formData.company}
												onChange={(e) => handleInputChange("company", e.target.value)}
												disabled={status === "loading"}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="role">Role</Label>
											<Select
												value={formData.role}
												onValueChange={(value) => handleInputChange("role", value)}
												disabled={status === "loading"}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select your role" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="developer">Developer</SelectItem>
													<SelectItem value="founder">Founder/CEO</SelectItem>
													<SelectItem value="cto">CTO</SelectItem>
													<SelectItem value="product-manager">Product Manager</SelectItem>
													<SelectItem value="designer">Designer</SelectItem>
													<SelectItem value="freelancer">Freelancer</SelectItem>
													<SelectItem value="student">Student</SelectItem>
													<SelectItem value="other">Other</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="grid gap-4 sm:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="projectType">Project Type</Label>
											<Select
												value={formData.projectType}
												onValueChange={(value) => handleInputChange("projectType", value)}
												disabled={status === "loading"}
											>
												<SelectTrigger>
													<SelectValue placeholder="What are you building?" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="saas">SaaS Application</SelectItem>
													<SelectItem value="ecommerce">E-commerce</SelectItem>
													<SelectItem value="marketplace">Marketplace</SelectItem>
													<SelectItem value="portfolio">Portfolio/Blog</SelectItem>
													<SelectItem value="dashboard">Dashboard/Admin</SelectItem>
													<SelectItem value="landing">Landing Page</SelectItem>
													<SelectItem value="mobile-app">Mobile App</SelectItem>
													<SelectItem value="other">Other</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="timeline">Launch Timeline</Label>
											<Select
												value={formData.timeline}
												onValueChange={(value) => handleInputChange("timeline", value)}
												disabled={status === "loading"}
											>
												<SelectTrigger>
													<SelectValue placeholder="When do you plan to launch?" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="asap">ASAP</SelectItem>
													<SelectItem value="1-month">Within 1 month</SelectItem>
													<SelectItem value="3-months">Within 3 months</SelectItem>
													<SelectItem value="6-months">Within 6 months</SelectItem>
													<SelectItem value="exploring">Just exploring</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="interests">What features are you most excited about?</Label>
										<Textarea
											id="interests"
											placeholder="Tell us what features or integrations you're most interested in..."
											value={formData.interests}
											onChange={(e) => handleInputChange("interests", e.target.value)}
											disabled={status === "loading"}
											rows={3}
										/>
									</div>

									<Button
										type="submit"
										size="lg"
										disabled={status === "loading"}
										className="w-full h-14 text-base bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
									>
										{status === "loading" ? (
											<div className="flex items-center gap-2">
												<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
												<span>Joining the waitlist...</span>
											</div>
										) : (
											<div className="flex items-center gap-2">
												<span>Join the Waitlist</span>
												<ArrowRight className="h-4 w-4" />
											</div>
										)}
									</Button>

									<p className="text-center text-xs text-slate-500 dark:text-slate-400">
										We'll only email you about Shipkit updates. No spam, no selling your data, no
										BS.
									</p>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
