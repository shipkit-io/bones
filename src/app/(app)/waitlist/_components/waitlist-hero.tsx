"use client";

import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addToWaitlistSimple } from "@/server/actions/waitlist-actions";

export function WaitlistHero() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const { toast } = useToast();

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setStatus("loading");

		try {
			const result = await addToWaitlistSimple(email);

			if (result.success) {
				setStatus("success");
				setEmail("");
				toast({
					title: "Welcome aboard! 🚀",
					description: "You're now on the exclusive early access list. We'll be in touch soon!",
				});
			} else {
				console.error("Error adding to waitlist:", result.error);
				setStatus("error");
				toast({
					title: "Oops, something went wrong",
					description: result.error || "Mind trying again? We promise it'll work this time.",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error submitting form:", error);
			setStatus("error");
			toast({
				title: "Oops, something went wrong",
				description: "Mind trying again? We promise it'll work this time.",
				variant: "destructive",
			});
		}
	};

	return (
		<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
			{/* Background */}
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800" />
				<div className="absolute inset-0 opacity-40">
					<div
						className="absolute top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-transparent rounded-full blur-3xl animate-pulse"
						style={{ animationDuration: "6s" }}
					/>
					<div
						className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse"
						style={{ animationDuration: "8s", animationDelay: "2s" }}
					/>
				</div>
				<div
					className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)]"
					style={{ backgroundSize: "32px 32px" }}
				/>
			</div>

			<div className="container relative z-10 px-4 md:px-6 text-center">
				<div className="mx-auto max-w-4xl">
					{/* Launch Badge */}
					<div className="mb-8 flex justify-center">
						<Badge
							variant="outline"
							className="bg-white/90 dark:bg-slate-900/90 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 px-4 py-2 text-sm font-medium backdrop-blur-sm"
						>
							<Sparkles className="mr-2 h-3.5 w-3.5" />
							50% OFF Early Access • March 2025
						</Badge>
					</div>

					{/* Main Headline */}
					<h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
						<span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
							Ship in Days
						</span>
						<span className="block mt-2 text-slate-900 dark:text-white">Not Weeks</span>
					</h1>

					{/* Value Proposition */}
					<p className="mx-auto mb-8 max-w-2xl text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed">
						The Next.js starter that actually works.{" "}
						<span className="text-slate-900 dark:text-white font-semibold">
							Auth, payments, database, and deployment
						</span>{" "}
						— all configured and ready to ship.
					</p>

					{/* Key Benefits */}
					<div className="mb-12 flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
						<div className="flex items-center gap-2">
							<Zap className="h-4 w-4 text-green-500" />
							<span>3-week setup → 3 minutes</span>
						</div>
						<div className="flex items-center gap-2">
							<CheckCircle2 className="h-4 w-4 text-green-500" />
							<span>Production-ready code</span>
						</div>
						<div className="flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-green-500" />
							<span>1,200+ developers waiting</span>
						</div>
					</div>

					{/* Email Signup */}
					<div className="mx-auto mb-8 max-w-md">
						<form onSubmit={handleSubmit} className="relative group">
							<div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
							<div className="relative flex gap-2 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
								<Input
									type="email"
									placeholder="your@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="flex-1 h-12 text-base border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
									disabled={status === "loading" || status === "success"}
								/>
								<Button
									type="submit"
									disabled={status === "loading" || status === "success"}
									className="h-12 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
								>
									{status === "loading" ? (
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									) : status === "success" ? (
										<CheckCircle2 className="h-4 w-4" />
									) : (
										<>
											<span className="hidden sm:inline mr-2">Get Early Access</span>
											<ArrowRight className="h-4 w-4" />
										</>
									)}
								</Button>
							</div>
						</form>
						<p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
							Join 1,200+ developers. No spam, ever. Unsubscribe anytime.
						</p>
					</div>

					{/* Trust Signal */}
					<div className="flex justify-center items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
						<span>Built by developers who've shipped 100+ products</span>
					</div>
				</div>
			</div>
		</section>
	);
}
