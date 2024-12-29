"use client";

import { CustomerAvatars } from "@/app/(app)/(landing)/_components/customer-avatars";
import { Section } from "@/components/primitives/section";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { motion } from "framer-motion";
import { BrandLogos } from "./brand-logos";

const stats = [
	{
		value: "1k+",
		label: "Developers",
		description: `trust ${siteConfig.name} for their projects`,
	},
	{
		value: "100+",
		label: "Components",
		description: "production-ready and fully tested",
	},
	{
		value: "99%",
		label: "Satisfaction",
		description: "from verified customers",
	},
];

export const SocialProof = () => {
	return (
		<Section className="relative overflow-hidden">
			{/* Trust Badge */}
			<div className="mb-12 flex justify-center">
				<Badge variant="secondary" className="rounded-full px-4 py-1 text-sm">
					Trusted by developers worldwide
				</Badge>
			</div>

			{/* Stats Grid */}
			<div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
				{stats.map((stat, idx) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: idx * 0.2 }}
						className="text-center"
					>
						<div className="text-4xl font-bold tracking-tight">
							{stat.value}
						</div>
						<div className="mt-2 text-base font-semibold">{stat.label}</div>
						<div className="mt-1 text-sm text-muted-foreground">
							{stat.description}
						</div>
					</motion.div>
				))}
			</div>

			{/* Customer Avatars */}
			<div className="mb-16">
				<div className="text-center">
					<CustomerAvatars />
					<p className="mt-4 text-sm text-muted-foreground">
						Join thousands of developers building with {siteConfig.name}
					</p>
				</div>
			</div>

			<Separator className="mb-16" />

			{/* Brand Logos */}
			<div className="mb-16">
				<h3 className="mb-8 text-center text-sm font-semibold text-muted-foreground">
					Built with the same tools used at
				</h3>
				<BrandLogos />
			</div>
		</Section>
	);
};
