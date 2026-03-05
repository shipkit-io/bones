import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
	IconBrandAmazon,
	IconBrandFigma,
	IconBrandStripeFilled,
	IconBrandTesla,
	IconBrandTiktokFilled,
	IconBrandVercelFilled,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const brands = [
	{
		name: "Vercel",
		Logo: IconBrandVercelFilled,
		description: "The platform for frontend developers"
	},
	{
		name: "Stripe",
		Logo: IconBrandStripeFilled,
		description: "Financial infrastructure for the internet"
	},
	{
		name: "Figma",
		Logo: IconBrandFigma,
		description: "The collaborative interface design tool"
	},
	{
		name: "Tesla",
		Logo: IconBrandTesla,
		description: "Accelerating the world's transition to sustainable energy"
	},
	{
		name: "TikTok",
		Logo: IconBrandTiktokFilled,
		description: "The leading destination for short-form mobile video"
	},
	{
		name: "Amazon",
		Logo: IconBrandAmazon,
		description: "Earth's most customer-centric company"
	},
];

export const BrandLogos = () => {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-6">
			{brands.map(({ name, Logo, description }) => (
				<Tooltip key={name}>
					<TooltipTrigger asChild>
						<motion.div
							initial={{ opacity: 0 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							whileHover={{
								scale: 1.05,
								transition: { duration: 0.2 }
							}}
							className={cn(
								"flex flex-col items-center justify-center gap-2",
								"grayscale hover:grayscale-0",
								"cursor-pointer rounded-lg p-4",
								"bg-white/5 hover:bg-white/10",
								"border border-transparent hover:border-primary/10",
								"transition-all duration-200",
							)}
						>
							<Logo className="h-16 w-16 transition-colors duration-200" />
							<span className="text-xs text-muted-foreground">{name}</span>
						</motion.div>
					</TooltipTrigger>
					<TooltipContent side="bottom" className="max-w-[200px] text-center">
						<p className="font-medium">{name}</p>
						<p className="text-xs text-muted-foreground">{description}</p>
					</TooltipContent>
				</Tooltip>
			))}
		</div>
	);
};
