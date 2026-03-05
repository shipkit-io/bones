"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DismissibleCardProps {
	children: ReactNode;
	className?: string;
	storageKey: string;
	allowDismiss?: boolean;
	onDismiss?: () => void;
}

export const DismissibleCard = ({
	children,
	className,
	storageKey,
	allowDismiss = true,
	onDismiss,
}: DismissibleCardProps) => {
	const [isDismissed, setIsDismissed] = useLocalStorage(storageKey, false);

	const handleDismiss = () => {
		setIsDismissed(true);
		onDismiss?.();
	};

	if (isDismissed) {
		return null;
	}

	return (
		<Card className={cn("relative", className)}>
			{allowDismiss && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute right-2 top-2 h-6 w-6"
					onClick={handleDismiss}
					title="Dismiss"
				>
					<X className="h-4 w-4" />
				</Button>
			)}
			{children}
		</Card>
	);
};
