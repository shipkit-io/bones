import { cn } from "@/lib/utils";

interface Stat {
	value: string;
	label: string;
	description?: string;
}

interface StatsProps {
	title: string;
	subtitle: string;
	stats: Stat[];
	columns?: 2 | 3 | 4;
	background?: "white" | "gray";
}

export const Stats = ({
	title,
	subtitle,
	stats,
	columns = 3,
	background = "white",
}: StatsProps) => {
	return (
		<section
			className={cn("py-20", {
				"bg-white": background === "white",
				"bg-gray-50": background === "gray",
			})}
		>
			<div className="container mx-auto px-4">
				{/* Header */}
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
				</div>

				{/* Stats Grid */}
				<div
					className={cn("grid gap-8 max-w-6xl mx-auto", {
						"grid-cols-1 md:grid-cols-2": columns === 2,
						"grid-cols-1 md:grid-cols-3": columns === 3,
						"grid-cols-1 md:grid-cols-2 lg:grid-cols-4": columns === 4,
					})}
				>
					{stats.map((stat, index) => (
						<div
							key={index}
							className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
						>
							<div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
							<div className="text-lg font-semibold mb-2">{stat.label}</div>
							{stat.description && <p className="text-gray-600">{stat.description}</p>}
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
