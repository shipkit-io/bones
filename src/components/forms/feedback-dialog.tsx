"use client";

import { ExternalLink, Loader2, Mail } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { generateFeedbackMailto } from "@/lib/utils/email-utils";
import { submitFeedback } from "@/server/actions/feedback-actions";

interface FeedbackDialogProps {
	trigger?: React.ReactNode;
	className?: string;
}

export const FeedbackDialog = ({ trigger, className }: FeedbackDialogProps) => {
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [feedback, setFeedback] = useState("");
	const [open, setOpen] = useState(false);
	const [showEmailFallback, setShowEmailFallback] = useState(false);

	// Reset form when dialog closes
	useEffect(() => {
		if (!open) {
			// Small delay to allow animation to complete
			const timeout = setTimeout(() => {
				setFeedback("");
				setError(null);
				setSuccess(false);
				setShowEmailFallback(false);
			}, 300);
			return () => clearTimeout(timeout);
		}
	}, [open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!feedback.trim()) return;

		setLoading(true);
		setSuccess(false);
		setError(null);
		setShowEmailFallback(false);

		try {
			const result = await submitFeedback({
				content: feedback.trim(),
				source: "dialog",
			});

			if (result.success) {
				if (result.requiresEmailFallback) {
					setShowEmailFallback(true);
				} else {
					setSuccess(true);
					// Close dialog after success
					const timeout = setTimeout(() => {
						setOpen(false);
					}, 1500);
					return () => clearTimeout(timeout);
				}
			} else {
				setError(result.error ?? "Failed to send feedback. Please try again.");
			}
		} catch (error) {
			setError("Failed to send feedback. Please try again.");
			console.error("Feedback submission error:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleEmailFallback = () => {
		const mailtoLink = generateFeedbackMailto(feedback.trim(), "dialog");
		window.open(mailtoLink, "_blank");
		setSuccess(true);
		// Close dialog after opening email
		const timeout = setTimeout(() => {
			setOpen(false);
		}, 1500);
		return () => clearTimeout(timeout);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="w-full" asChild>
				<div className="w-full">
					{trigger ?? (
						<Button variant="ghost" className={`w-full ${className}`}>
							Feedback
						</Button>
					)}
				</div>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Send Feedback</DialogTitle>
						<DialogDescription>
							Help us improve by sharing your thoughts, suggestions, or reporting issues.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 space-y-4">
						<Textarea
							value={feedback}
							onChange={(e) => setFeedback(e.target.value)}
							placeholder="Your feedback..."
							className="min-h-[100px]"
							disabled={loading}
						/>
						{error && <p className="text-sm text-red-500">{error}</p>}
						{success && <p className="text-sm text-green-500">Thank you for your feedback! 🚀</p>}
						{showEmailFallback && (
							<div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
								<div className="flex items-start gap-3">
									<Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
									<div className="space-y-2">
										<p className="text-sm text-blue-800 dark:text-blue-200">
											Email service not configured. Click below to open your email client:
										</p>
										<Button
											type="button"
											size="sm"
											onClick={handleEmailFallback}
											className="bg-blue-600 hover:bg-blue-700 text-white"
										>
											<ExternalLink className="mr-2 h-4 w-4" />
											Open Email Client
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
					<DialogFooter className="mt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						{!showEmailFallback && (
							<Button type="submit" disabled={loading || !feedback.trim()}>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sending...
									</>
								) : success ? (
									"Sent!"
								) : (
									"Send Feedback"
								)}
							</Button>
						)}
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
