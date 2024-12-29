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
import { logger } from "@/lib/logger";
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
			await new Promise((resolve) => setTimeout(resolve, 1000));
				setSuccess(true);
		} catch (error) {
			logger.error("Failed to send feedback", { error });
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
