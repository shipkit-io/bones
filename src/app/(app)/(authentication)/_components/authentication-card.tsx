import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AuthenticationCard({ children, className }: { children: React.ReactNode, className?: string }) {
	return (
		<Card className={cn("mx-auto min-w-[400px] max-w-[400px] overflow-hidden", className)}>
			{children}
		</Card>
	);
}
