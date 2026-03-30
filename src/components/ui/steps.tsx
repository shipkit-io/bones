"use client";

import type { ReactNode } from "react";
import { Children, isValidElement } from "react";
import { cn } from "@/lib/utils";

interface StepProps {
  title: string;
  children?: ReactNode;
}

interface StepsProps {
  children: ReactNode;
  className?: string;
}

export const Step = ({ title, children }: StepProps) => {
  return null;
};

export const Steps = ({ children, className }: StepsProps) => {
  const steps = Children.toArray(children).filter(isValidElement);
  const total = steps.length;

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      {steps.map((child, index) => {
        const stepNumber = index + 1;
        const isLast = index === total - 1;
        const props = child.props as StepProps;

        return (
          <div key={stepNumber} className="flex gap-6">
            <div className="flex flex-col items-center">
              <div className="flex size-8 flex-none select-none items-center justify-center rounded-full border border-neutral-400/20 bg-neutral-100 text-sm font-medium text-neutral-700 dark:border-neutral-400/10 dark:bg-neutral-800 dark:text-neutral-50">
                {stepNumber}
              </div>
              {!isLast && (
                <div className="relative my-2 h-full w-px rounded-full bg-neutral-200 dark:bg-neutral-700" />
              )}
            </div>
            <div className="mb-4 w-full pb-2">
              <h6 className="mb-2 ml-1 text-lg font-medium tracking-tight text-neutral-700 dark:text-neutral-50">
                {props.title}
              </h6>
              <div className="ml-1 text-sm text-muted-foreground [&>pre]:my-2 [&>p]:my-1">
                {props.children}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
