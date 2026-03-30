"use client";

import type { PanInfo } from "framer-motion";

export function useSwipe(onSwipe: (direction: "left" | "right") => void) {
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  return { handleDragEnd };
}
