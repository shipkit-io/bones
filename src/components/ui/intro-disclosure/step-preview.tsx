"use client";

import { motion, useAnimation } from "framer-motion";
import Image from "next/image";
import * as React from "react";

import { slideInOut } from "./animations";
import type { Step } from "./types";

export function StepPreview({ step, direction }: { step: Step; direction: 1 | -1 }) {
  const controls = useAnimation();

  React.useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { delay: 0.2, duration: 0.3 },
    });
  }, [controls, step]);

  return (
    <motion.div
      {...slideInOut(direction)}
      className="relative h-full w-full overflow-hidden rounded-sm rounded-rb-lg rounded-tl-xl ring-2 ring-black/10 dark:ring-black/10 dark:ring-offset-black ring-offset-8"
    >
      {step.media ? (
        <div className="relative bg-black h-full w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            className="h-full w-full max-h-[700px]"
          >
            {step.media.type === "image" ? (
              <Image
                src={step.media.src || "/placeholder.svg"}
                alt={step.media.alt || ""}
                fill
                className="object-cover"
              />
            ) : (
              <video src={step.media.src} controls className="h-full w-full object-cover" />
            )}
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            className="absolute bottom-0 left-0 right-0 p-6"
          >
            <h3 className="mb-2 text-2xl font-semibold text-white">{step.title}</h3>
            <p className="text-white hidden md:block">{step.full_description}</p>
          </motion.div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={controls} className="text-center">
            <h3 className="mb-2 text-2xl font-semibold text-primary">{step.title}</h3>
            <div className="text-muted-foreground">{step.full_description}</div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
