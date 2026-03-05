"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { siteConfig } from "@/config/site-config";
import { oneTimePlans } from "@/content/pricing/pricing-content";
import { motion } from "framer-motion";
import { Calculator, Clock, DollarSign, Users } from "lucide-react";
import { useState } from "react";

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value);
};

export const ROICalculator = () => {
	const [teamSize, setTeamSize] = useState(3);
	const [monthsToLaunch, setMonthsToLaunch] = useState(6);
	const [monthlyBurn, setMonthlyBurn] = useState(20000);

	// Get the highest priced plan
	const shipkitCost = Math.max(...oneTimePlans.map(plan => plan.price.oneTime || 0));

	// Calculate savings
	const avgDevSalary = 150000; // Average developer salary in 2024
	const devCostPerMonth = (avgDevSalary / 12) * teamSize;
	const infrastructureCost = 2000 * monthsToLaunch; // Monthly infrastructure and tooling costs
	const traditionalCost = (devCostPerMonth * monthsToLaunch) + infrastructureCost;
	const totalSavings = traditionalCost - shipkitCost;
	const timeToMarket = monthsToLaunch - 1; // Months saved with ShipKit
	const burnSavings = monthlyBurn * timeToMarket;

	return (
		<Card className="p-6">
			<div className="grid gap-8 md:grid-cols-2">
				<div className="space-y-8">
					<div className="space-y-4">
						<Label className="text-lg font-medium">Team Size</Label>
						<div className="flex items-center gap-4">
							<Users className="h-5 w-5 text-muted-foreground" />
							<Slider
								value={[teamSize]}
								onValueChange={(values) => setTeamSize(values[0] || teamSize)}
								min={1}
								max={10}
								step={1}
								className="w-full"
							/>
							<span className="min-w-[4ch] text-right tabular-nums">{teamSize}</span>
						</div>
					</div>

					<div className="space-y-4">
						<Label className="text-lg font-medium">Months to Launch (Traditional)</Label>
						<div className="flex items-center gap-4">
							<Clock className="h-5 w-5 text-muted-foreground" />
							<Slider
								value={[monthsToLaunch]}
								onValueChange={(values) => setMonthsToLaunch(values[0] || monthsToLaunch)}
								min={3}
								max={12}
								step={1}
								className="w-full"
							/>
							<span className="min-w-[4ch] text-right tabular-nums">{monthsToLaunch}</span>
						</div>
					</div>

					<div className="space-y-4">
						<Label className="text-lg font-medium">Monthly Burn Rate</Label>
						<div className="flex items-center gap-4">
							<DollarSign className="h-5 w-5 text-muted-foreground" />
							<Slider
								value={[monthlyBurn]}
								onValueChange={(values) => setMonthlyBurn(values[0] || monthlyBurn)}
								min={5000}
								max={100000}
								step={5000}
								className="w-full"
							/>
							<span className="min-w-[8ch] text-right tabular-nums">{formatCurrency(monthlyBurn)}</span>
						</div>
					</div>
				</div>

				<div className="space-y-8">
					<div className="rounded-lg bg-primary/10 p-6">
						<h3 className="flex items-center gap-2 text-lg font-medium">
							<Calculator className="h-5 w-5" />
							Your Potential Savings
						</h3>
						<div className="mt-6 space-y-6">
							<div>
								<div className="text-sm text-muted-foreground">Development Costs</div>
								<motion.div
									key={totalSavings}
									initial={{ scale: 0.95 }}
									animate={{ scale: 1 }}
									className="text-3xl font-bold tabular-nums text-primary"
								>
									{formatCurrency(totalSavings)}
								</motion.div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground">Time to Market</div>
								<motion.div
									key={timeToMarket}
									initial={{ scale: 0.95 }}
									animate={{ scale: 1 }}
									className="text-3xl font-bold tabular-nums text-primary"
								>
									{timeToMarket} Months Faster
								</motion.div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground">Burn Rate Savings</div>
								<motion.div
									key={burnSavings}
									initial={{ scale: 0.95 }}
									animate={{ scale: 1 }}
									className="text-3xl font-bold tabular-nums text-primary"
								>
									{formatCurrency(burnSavings)}
								</motion.div>
							</div>
						</div>
					</div>

					<div className="space-y-4 text-sm text-muted-foreground">
						<p>* Calculations based on:</p>
						<ul className="list-disc pl-4 space-y-2">
							<li>Average developer salary of {formatCurrency(avgDevSalary)}/year in 2024</li>
							<li>Infrastructure and tooling costs of {formatCurrency(2000)}/month</li>
							<li>Typical time savings of 75% with {siteConfig.title}</li>
							<li>One-time {siteConfig.title} cost of {formatCurrency(shipkitCost)}</li>
						</ul>
					</div>
				</div>
			</div>
		</Card>
	);
};
