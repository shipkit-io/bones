import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Feature } from "@/types/feature";
import type { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import type { FC } from "react";
import React from "react";

interface FeatureCardProps {
    feature: Feature;
    className?: string;
}

export const FeatureCard: FC<FeatureCardProps> = ({ feature, className }) => {
    const Icon = feature.icon ? (Icons[feature.icon as keyof typeof Icons] as LucideIcon) : null;

    return (
        <Card
            className={cn(
                "flex flex-col items-start justify-start space-y-3 p-6",
                className,
            )}
        >
            {Icon && <Icon className="h-6 w-6 text-primary" />}
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{feature.name}</h3>
                    {feature.badge && (
                        <Badge
                            variant={
                                feature.badge === "new"
                                    ? "default"
                                    : feature.badge === "popular"
                                        ? "secondary"
                                        : "outline"
                            }
                            className={cn(
                                "h-5 text-xs",
                                feature.badge === "pro" &&
                                "bg-gradient-to-r from-indigo-500 to-purple-500",
                            )}
                        >
                            {feature.badge}
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
        </Card>
    );
};
