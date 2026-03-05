import { cn } from "@/lib/utils";

interface DividerProps {
	text?: string;
	className?: string;
}

export const Divider = ({ text, className }: DividerProps) => {
	return (
		<div className="relative">
			<div className="absolute inset-0 flex items-center">
				<span className="w-full border-t" />
			</div>
			{text && (
				<div className="relative flex justify-center text-xs uppercase">
					<span className={cn("bg-background px-2 text-muted-foreground", className)}>{text}</span>
				</div>
			)}
		</div>
	);
};
