"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export const DownloadSubmitButton = ({ children, ...props }: ButtonProps) => {
	const { pending } = useFormStatus();
	const [timeoutElapsed, setTimeoutElapsed] = useState(false);

	useEffect(() => {
		if (!pending) {
			setTimeoutElapsed(false);
			return;
		}

		const timer = setTimeout(() => setTimeoutElapsed(true), 10_000);
		return () => clearTimeout(timer);
	}, [pending]);

	const showSpinner = pending && !timeoutElapsed;
	const isDisabled = showSpinner;

	return (
		<Button type="submit" size="lg" disabled={isDisabled} aria-busy={showSpinner} {...props}>
			{showSpinner ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Generating...
				</>
			) : (
				children
			)}
		</Button>
	);
};
