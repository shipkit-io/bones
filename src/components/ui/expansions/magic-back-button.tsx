import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { usePageTrackerStore } from "react-page-tracker";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const MagicBackButton = React.forwardRef<
	HTMLButtonElement,
	ButtonProps & { backLink?: string }
>(({ className, onClick, children, backLink = "/", ...props }, ref) => {
	const router = useRouter();
	const isFirstPage = usePageTrackerStore((state) => state.isFirstPage);
	return (
		<Button
			className={cn("rounded-full", className)}
			variant="outline"
			size="icon"
			ref={ref}
			onClick={(e) => {
				if (isFirstPage) {
					router.push(backLink);
				} else {
					router.back();
				}
				onClick?.(e);
			}}
			{...props}
		>
			{children ?? <ChevronLeft />}
		</Button>
	);
});
MagicBackButton.displayName = "MagicBackButton";
