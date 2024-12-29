"use client";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
	value: string;
	className?: string;
	timeout?: number;
}

export const CopyButton = ({ value, className, timeout = 2000, ...props }: CopyButtonProps) => {
	const { toast } = useToast();
	const { isCopied, copyToClipboard } = useCopyToClipboard({
		timeout: 2000,
		onCopy: () => {
			toast({
				title: "Copied!",
				description: "API key copied to clipboard",
			});
		},
	});

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className={cn("h-8 w-8 relative", className)}
						onClick={() => copyToClipboard(value)}
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={isCopied ? "check" : "copy"}
								initial={{ opacity: 0, y: -1 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 1 }}
								transition={{
									type: "spring",
									stiffness: 500,
									damping: 30,
									mass: 0.5,
								}}
								className="absolute inset-0 flex items-center justify-center"
							>
								{isCopied ? (
									<Check className="h-4 w-4 text-green-500" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</motion.div>
						</AnimatePresence>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{isCopied ? "Copied!" : "Copy API key"}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
