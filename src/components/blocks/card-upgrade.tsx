import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "@/components/primitives/link";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DismissibleCard } from "@/components/ui/dismissible-card";
import { cn } from "@/lib/utils";

const cardUpgradeVariants = cva("", {
	variants: {
		size: {
			default: "",
			sm: "max-w-sm",
			lg: "max-w-lg",
		},
		variant: {
			default: "",
			primary: "bg-primary text-primary-foreground",
			secondary: "bg-secondary text-secondary-foreground",
			ghost: "border-none shadow-none",
		},
	},
	defaultVariants: {
		size: "default",
		variant: "default",
	},
});

interface CardUpgradeProps extends VariantProps<typeof cardUpgradeVariants> {
	className?: string;
	title?: string;
	description?: string;
	icon?: LucideIcon;
	buttonText?: string;
	buttonVariant?: "default" | "secondary" | "outline" | "ghost";
	buttonIcon?: LucideIcon;
	buttonIconplacement?: "left" | "right";
	href?: string;
	onClick?: () => void;
	storageKey?: string;
	allowDismiss?: boolean;
	onDismiss?: () => void;
}

export const CardUpgrade = ({
	className,
	size,
	variant,
	title = "Upgrade to Pro",
	description = "Unlock all features and get unlimited access to our support team.",
	icon: Icon,
	buttonText = "Upgrade",
	buttonVariant = "default",
	buttonIcon: ButtonIcon = ArrowRight,
	buttonIconplacement = "right",
	href,
	onClick,
	storageKey = "card_upgrade_dismissed",
	allowDismiss = true,
	onDismiss,
}: CardUpgradeProps) => {
	return (
		<DismissibleCard
			className={cn(cardUpgradeVariants({ size, variant }), className)}
			storageKey={storageKey}
			allowDismiss={allowDismiss}
			onDismiss={onDismiss}
		>
			<CardHeader>
				<div className="flex items-center gap-2">
					{Icon && <Icon className="h-5 w-5" />}
					<CardTitle>{title}</CardTitle>
				</div>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				{href ? (
					<Link href={href}>
						<Button size="sm" variant={buttonVariant} className="w-full" type="button">
							{buttonIconplacement === "left" && ButtonIcon && (
								<ButtonIcon className="mr-2 h-4 w-4" />
							)}
							{buttonText}
							{buttonIconplacement === "right" && ButtonIcon && (
								<ButtonIcon className="ml-2 h-4 w-4" />
							)}
						</Button>
					</Link>
				) : (
					<Button
						size="sm"
						variant={buttonVariant}
						className="w-full"
						onClick={onClick}
						type="button"
					>
						{buttonIconplacement === "left" && ButtonIcon && (
							<ButtonIcon className="mr-2 h-4 w-4" />
						)}
						{buttonText}
						{buttonIconplacement === "right" && ButtonIcon && (
							<ButtonIcon className="ml-2 h-4 w-4" />
						)}
					</Button>
				)}
			</CardContent>
		</DismissibleCard>
	);
};
