"use client";

import { CheckIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { fadeInScale, hoverScale } from "./animations";
import type { Step } from "./types";

interface StepTabProps {
  step: Step;
  isActive: boolean;
  onClick: () => void;
  isCompleted: boolean;
}

export function StepTab({ step, isActive, onClick, isCompleted }: StepTabProps) {
  return (
    <motion.button
      {...hoverScale}
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-start rounded-lg px-4 py-2 text-left transition-colors",
        isActive ? "border border-border bg-muted" : "hover:bg-muted/70",
        "relative"
      )}
      aria-current={isActive ? "step" : undefined}
      aria-label={`${step.title}${isCompleted ? " (completed)" : ""}`}
    >
      <div className="mb-1 text-sm font-medium">{step.title}</div>
      <div className="line-clamp-2 hidden text-xs text-muted-foreground md:block">
        {step.short_description}
      </div>
      {isCompleted && (
        <motion.div {...fadeInScale} className="absolute right-2 top-2">
          <div className="rounded-full bg-primary p-1">
            <CheckIcon className="h-2 w-2 text-primary-foreground" />
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}
