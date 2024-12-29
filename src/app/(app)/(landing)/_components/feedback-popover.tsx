"use client";

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
import { submitFeedback } from "@/server/actions/feedback-actions";
import { useState } from "react";

export const FeedbackPopover = () => {
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (content: string) => {
		setLoading(true);
		setSuccess(false);
		setError(null);

		try {
			const result = await submitFeedback({
				content,
				source: "popover",
			});

			if (result.success) {
				setSuccess(true);
			} else {
				setError(result.error ?? "Failed to send feedback. Please try again.");
			}
		} catch (error) {
			setError("Failed to send feedback. Please try again.");
		} finally {
			setLoading(false);
		}
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
			<div className="mt-2">
				{success && <span className="text-green-500">Sent 🚀</span>}
				{error && <span className="text-red-500">{error}</span>}
			</div>
		</div>
	);
};
