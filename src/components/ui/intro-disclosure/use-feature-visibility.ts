"use client";

import * as React from "react";

export function useFeatureVisibility(featureId: string) {
  const [isVisible, setIsVisible] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const storedValue = localStorage.getItem(`feature_${featureId}`);
    setIsVisible(storedValue ? JSON.parse(storedValue) : true);
  }, [featureId]);

  const hideFeature = () => {
    localStorage.setItem(`feature_${featureId}`, JSON.stringify(false));
    setIsVisible(false);
  };

  const resetFeature = () => {
    localStorage.removeItem(`feature_${featureId}`);
    setIsVisible(true);
  };

  return { isVisible: isVisible === null ? false : isVisible, hideFeature, resetFeature };
}
