import { cn } from "@/lib/utils";

export default function BadgeClerk({
	className,
	children,
}: {
	className?: string;
	children?: React.ReactNode;
}) {
	return (
		<span
			className={cn(
				"relative bg-blue-50 px-[0.1875rem] text-[0.625rem]/[0.875rem] font-medium text-blue-500 dark:bg-blue-950",
				className
			)}
		>
			{children}
			<span className="absolute inset-x-[-0.1875rem] -top-px block transform-gpu text-blue-200 dark:text-blue-900">
				<svg
					aria-hidden="true"
					height="1"
					stroke="currentColor"
					strokeDasharray="3.3 1"
					width="100%"
				>
					<line x1="0" x2="100%" y1="0.5" y2="0.5" />
				</svg>
			</span>
			<span className="absolute inset-x-[-0.1875rem] -bottom-px block transform-gpu text-blue-200 dark:text-blue-900">
				<svg
					aria-hidden="true"
					height="1"
					stroke="currentColor"
					strokeDasharray="3.3 1"
					width="100%"
				>
					<line x1="0" x2="100%" y1="0.5" y2="0.5" />
				</svg>
			</span>
			<span className="absolute inset-y-[-0.1875rem] -left-px block transform-gpu text-blue-200 dark:text-blue-900">
				<svg
					aria-hidden="true"
					height="100%"
					stroke="currentColor"
					strokeDasharray="3.3 1"
					width="1"
				>
					<line x1="0.5" x2="0.5" y1="0" y2="100%" />
				</svg>
			</span>
			<span className="absolute inset-y-[-0.1875rem] -right-px block transform-gpu text-blue-200 dark:text-blue-900">
				<svg
					aria-hidden="true"
					height="100%"
					stroke="currentColor"
					strokeDasharray="3.3 1"
					width="1"
				>
					<line x1="0.5" x2="0.5" y1="0" y2="100%" />
				</svg>
			</span>
		</span>
	);
}
