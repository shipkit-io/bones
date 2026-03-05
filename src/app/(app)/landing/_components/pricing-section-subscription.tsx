"use client";

import type { PricingPlan } from "@/content/pricing/pricing-content";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckIcon, EuroIcon } from "lucide-react";
import { useState } from "react";

type BilledType = "monthly" | "annually";

interface PricingSectionSubscriptionProps {
	plans?: PricingPlan[];
}

export const PricingSectionSubscription = ({ plans }: PricingSectionSubscriptionProps) => {
	const [selectedBilledType, setSelectedBilledType] = useState<BilledType>("monthly");

	function handleSwitchTab(tab: BilledType) {
		setSelectedBilledType(tab);
	}

	return (
		<div className="mx-auto w-full max-w-5xl">
			<div className="mb-8 flex flex-col items-center justify-center gap-4">
				<SelectOfferTab
					handleSwitchTab={handleSwitchTab}
					selectedBilledType={selectedBilledType}
				/>
			</div>
			<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{plans?.map((plan) => (
					<OfferCard
						key={plan.title}
						{...plan}
						selectedBilledType={selectedBilledType}
					/>
				))}
			</div>
		</div>
	);
};

const OfferCard = ({
	title,
	description,
	price,
	features,
	infos,
	isBestValue,
	selectedBilledType,
}: PricingPlan & {
	selectedBilledType: BilledType;
}) => {
	function getAnnualPrice() {
		return price.annually || 0;
	}

	function getMonthlyPrice() {
		return price.monthly || 0;
	}

	const currentPrice =
		selectedBilledType === "annually" ? getAnnualPrice() : getMonthlyPrice();

	return (
		<div
			className={cn(
				"relative rounded-2xl border bg-card p-8",
				isBestValue && "border-primary shadow-lg",
			)}
		>
			{isBestValue && (
				<div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
					Most popular
				</div>
			)}

			<div className="mb-5">
				<h3 className="font-display text-lg font-bold">{title}</h3>
				<p className="text-muted-foreground">{description}</p>
			</div>

			<div className="mb-5">
				<div className="flex items-end text-3xl font-semibold">
					<EuroIcon className="h-4 w-4" />
					{currentPrice}
					<span className="text-sm font-normal text-muted-foreground">
						/{selectedBilledType === "annually" ? "year" : "month"}
					</span>
				</div>
			</div>

			<ul className="mb-5 space-y-4">
				{features.map((feature) => (
					<li key={feature} className="flex items-start gap-3 text-muted-foreground">
						<CheckIcon className="h-5 w-5 shrink-0" />
						<span>{feature}</span>
					</li>
				))}
			</ul>

			{infos && (
				<div className="space-y-4 text-sm text-muted-foreground">
					{infos.map((info) => (
						<p key={info}>{info}</p>
					))}
				</div>
			)}
		</div>
	);
};

export function SelectOfferTab({
	handleSwitchTab,
	selectedBilledType,
}: Readonly<{
	handleSwitchTab: (tab: BilledType) => void;
	selectedBilledType: BilledType;
}>) {
	return (
		<div className="relative flex h-10 items-center rounded-full border p-1">
			<motion.div
				className="absolute h-8 rounded-full bg-primary"
				animate={{
					left: selectedBilledType === "monthly" ? 4 : "50%",
					right: selectedBilledType === "monthly" ? "50%" : 4,
				}}
				transition={{
					duration: 0.2,
				}}
			/>
			<button
				onClick={() => handleSwitchTab("monthly")}
				className={cn(
					"relative z-10 flex-1 rounded-full px-4 text-sm font-medium transition-colors",
					selectedBilledType === "monthly"
						? "text-primary-foreground"
						: "text-foreground",
				)}
			>
				Monthly
			</button>
			<button
				onClick={() => handleSwitchTab("annually")}
				className={cn(
					"relative z-10 flex-1 rounded-full px-4 text-sm font-medium transition-colors",
					selectedBilledType === "annually"
						? "text-primary-foreground"
						: "text-foreground",
				)}
			>
				Annually
			</button>
		</div>
	);
}
