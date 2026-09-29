"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";

import { StepContent } from "./step-content";
import { StepPreview } from "./step-preview";
import { StepTab } from "./step-tab";
import type { FeatureDisclosureProps } from "./types";
import { useFeatureVisibility } from "./use-feature-visibility";
import { useMediaQuery } from "./use-media-query";
import { useSwipe } from "./use-swipe";

export function IntroDisclosure({
  steps,
  open,
  setOpen,
  featureId,
  onComplete,
  onSkip,
  showProgressBar = true,
  forceVariant,
  initialStep,
  onStepChange,
  initialCompletedSteps,
}: FeatureDisclosureProps) {
  const [currentStep, setCurrentStep] = React.useState(initialStep ?? 0);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>(
    initialCompletedSteps ?? [0]
  );
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const isDesktopQuery = useMediaQuery("(min-width: 768px)");
  const isDesktop = forceVariant ? forceVariant === "desktop" : isDesktopQuery;
  const { isVisible, hideFeature } = useFeatureVisibility(featureId);
  const stepRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isVisible) {
      setOpen(false);
    }
  }, [isVisible, setOpen]);

  React.useEffect(() => {
    if (open && stepRef.current) {
      stepRef.current.focus();
    }
  }, [open, currentStep]);

  React.useEffect(() => {
    if (open && typeof initialStep === "number") {
      setCurrentStep(initialStep);
    }
  }, [open, initialStep]);

  React.useEffect(() => {
    if (initialCompletedSteps && initialCompletedSteps.length > 0) {
      setCompletedSteps((prev) => {
        const merged = new Set([...prev, ...initialCompletedSteps]);
        return Array.from(merged);
      });
    }
  }, [initialCompletedSteps]);

  const handleNext = () => {
    setDirection(1);
    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      onStepChange?.(next);
    } else {
      setOpen(false);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    setDirection(-1);
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onStepChange?.(prev);
    }
  };

  const handleSkip = () => {
    setOpen(false);
    onSkip?.();
  };

  const handleStepSelect = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCompletedSteps((prev) => {
      const newCompletedSteps = new Set(prev);
      if (index > currentStep) {
        for (let i = currentStep; i <= index; i++) {
          newCompletedSteps.add(i);
        }
      }
      return Array.from(newCompletedSteps);
    });
    setCurrentStep(index);
    onStepChange?.(index);
  };

  const handleSwipe = (swipeDirection: "left" | "right") => {
    if (swipeDirection === "left") {
      handleNext();
    } else {
      handlePrevious();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      handleNext();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      handlePrevious();
    }
  };

  const { handleDragEnd } = useSwipe(handleSwipe);

  if (!isVisible || !open) {
    return null;
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0" onKeyDown={handleKeyDown}>
          <DialogHeader className="space-y-2 border-b border-border bg-muted p-6">
            <DialogTitle>Feature Tour</DialogTitle>
            {showProgressBar && (
              <div className="mt-2 flex w-full justify-center">
                <Progress value={((currentStep + 1) / steps.length) * 100} className="h-1" />
              </div>
            )}
          </DialogHeader>

          <div className="grid h-full grid-cols-2">
            <div className="p-2 pr-[18px]">
              <StepContent
                steps={steps}
                currentStep={currentStep}
                onSkip={handleSkip}
                onNext={handleNext}
                onPrevious={handlePrevious}
                hideFeature={hideFeature}
                completedSteps={completedSteps}
                onStepSelect={handleStepSelect}
                direction={direction}
                isDesktop={isDesktop}
                stepRef={stepRef}
              />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {steps[currentStep] && (
                <StepPreview key={currentStep} step={steps[currentStep]} direction={direction} />
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="h-[95vh] max-h-[95vh]">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          onKeyDown={handleKeyDown}
          className="mx-auto flex h-full max-w-3xl flex-col"
        >
          <DrawerHeader className="space-y-4 pb-4 text-left">
            {showProgressBar && (
              <Progress value={((currentStep + 1) / steps.length) * 100} className="mb-4" />
            )}
            <DrawerTitle>{steps[currentStep]?.title}</DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-4 pb-32">
              <div className="mb-6 grid grid-cols-2 gap-2">
                {steps.map((step, index) => (
                  <StepTab
                    // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
                    key={index}
                    step={step}
                    isActive={currentStep === index}
                    onClick={() => handleStepSelect(index)}
                    isCompleted={completedSteps.includes(index)}
                  />
                ))}
              </div>
              <div className="relative aspect-video overflow-hidden rounded-lg ring-2 ring-border ring-offset-8 ring-offset-background">
                {steps[currentStep] && (
                  <StepPreview step={steps[currentStep]} direction={direction} />
                )}
              </div>

              <div className="space-y-4 rounded-lg border border-border p-3">
                <p className="text-muted-foreground">{steps[currentStep]?.short_description}</p>
                {steps[currentStep]?.action && (
                  <Button
                    asChild
                    className="w-full"
                    variant={steps[currentStep]?.action?.href ? "outline" : "default"}
                  >
                    {steps[currentStep]?.action?.href ? (
                      <a
                        href={steps[currentStep]?.action?.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        {steps[currentStep]?.action?.label}
                        <ExternalLinkIcon className="h-4 w-4" />
                      </a>
                    ) : (
                      <button type="button" onClick={steps[currentStep]?.action?.onClick}>
                        {steps[currentStep]?.action?.label}
                      </button>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 left-0 border-t bg-background">
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="rounded-full text-muted-foreground hover:bg-card"
                >
                  Skip all
                </Button>
                <div className="space-x-2">
                  {currentStep > 0 && (
                    <Button
                      onClick={handlePrevious}
                      size="sm"
                      variant="ghost"
                      className="rounded-full hover:bg-transparent"
                    >
                      Previous
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      handleNext();
                    }}
                    size="sm"
                    ref={stepRef}
                    className="rounded-full"
                  >
                    {currentStep === steps.length - 1 ? "Done" : "Next"}
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipNextTime"
                  onCheckedChange={() => {
                    hideFeature();
                  }}
                />
                <label htmlFor="skipNextTime" className="text-sm text-muted-foreground">
                  Don't show this again
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}
