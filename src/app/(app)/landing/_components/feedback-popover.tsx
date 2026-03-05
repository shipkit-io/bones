"use client";

import { Button } from "@/components/ui/button";
import {
	PopoverCloseButton,
	PopoverContent,
	PopoverFooter,
	PopoverForm,
	PopoverHeader,
	PopoverRoot,
	PopoverSubmitButton,
	PopoverTextarea,
	PopoverTrigger,
} from "@/components/ui/cults/animated-popover";
import { generateFeedbackMailto } from "@/lib/utils/email-utils";
import { submitFeedback } from "@/server/actions/feedback-actions";
import { ExternalLink, Mail } from "lucide-react";
import { useState } from "react";

export const FeedbackPopover = () => {
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showEmailFallback, setShowEmailFallback] = useState(false);
	const [feedbackContent, setFeedbackContent] = useState("");

	const handleSubmit = async (content: string) => {
		setLoading(true);
		setSuccess(false);
		setError(null);
		setShowEmailFallback(false);
		setFeedbackContent(content);

		try {
			const result = await submitFeedback({
				content,
				source: "popover",
			});

			if (result.success) {
				if (result.requiresEmailFallback) {
					setShowEmailFallback(true);
				} else {
					setSuccess(true);
				}
			} else {
				setError(result.error ?? "Failed to send feedback. Please try again.");
			}
		} catch (error) {
			setError("Failed to send feedback. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleEmailFallback = () => {
		const mailtoLink = generateFeedbackMailto(feedbackContent, "popover");
		window.open(mailtoLink, "_blank");
		setSuccess(true);
		setShowEmailFallback(false);
	};

	return (
		<div>
			<PopoverRoot>
				<PopoverTrigger disabled={loading}>
					{loading ? <span className="">Sending...</span> : "Feedback"}
				</PopoverTrigger>
				<PopoverContent>
					<PopoverForm onSubmit={(data) => void handleSubmit(data)}>
						<PopoverHeader>Let us know what you think</PopoverHeader>
						<PopoverTextarea />
						<PopoverFooter>
							<PopoverCloseButton />
							<PopoverSubmitButton />
						</PopoverFooter>
					</PopoverForm>
				</PopoverContent>
			</PopoverRoot>
			<div className="mt-2 space-y-2">
				{success && <span className="text-green-500">Sent 🚀</span>}
				{error && <span className="text-red-500">{error}</span>}
				{showEmailFallback && (
					<div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
						<div className="flex items-start gap-2">
							<Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
							<div className="space-y-2">
								<p className="text-xs text-blue-800 dark:text-blue-200">
									Email service not configured. Click to open your email client:
								</p>
								<Button
									type="button"
									size="sm"
									onClick={handleEmailFallback}
									className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
								>
									<ExternalLink className="mr-1 h-3 w-3" />
									Open Email
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
