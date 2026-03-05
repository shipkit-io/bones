import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-10 w-[50%]" />
				<Skeleton className="h-4 w-[80%]" />
			</div>
			<div className="space-y-4">
				<Skeleton className="h-4 w-[100%]" />
				<Skeleton className="h-4 w-[90%]" />
				<Skeleton className="h-4 w-[80%]" />
				<Skeleton className="h-4 w-[85%]" />
			</div>
			<div className="space-y-4">
				<Skeleton className="h-4 w-[100%]" />
				<Skeleton className="h-4 w-[90%]" />
				<Skeleton className="h-4 w-[95%]" />
				<Skeleton className="h-4 w-[85%]" />
			</div>
		</div>
	);
}
