import { motion } from "framer-motion";
import { Rocket, Shield, Zap } from "lucide-react";

const features = [
	{
		icon: Zap,
		title: "Lightning Fast",
		description: "Boost your productivity with our blazing fast CLI tool.",
	},
	{
		icon: Shield,
		title: "Secure",
		description: "Built with security in mind to keep your projects safe.",
	},
	{
		icon: Rocket,
		title: "Easy to Use",
		description: "Simple and intuitive commands for developers of all levels.",
	},
];

export function Features() {
	return (
		<section className="py-20 px-4 md:px-6 lg:px-8 bg-muted">
			<div className="max-w-6xl mx-auto">
				<h2 className="text-3xl font-bold text-center mb-12">Why Choose Our CLI?</h2>
				<div className="grid md:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<motion.div
							key={index}
							className="bg-background p-6 rounded-lg shadow-lg"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
						>
							<feature.icon className="h-12 w-12 mb-4 text-primary" />
							<h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
							<p className="text-muted-foreground">{feature.description}</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
