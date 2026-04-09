"use client";

import React from "react";
import { MotionConfig } from "motion/react";

export function AppMotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      // In Production wird die OS-/Browser-Einstellung für "Reduced Motion" respektiert ("user"),
      // in Development laufen Animationen immer ("never"), um die Warnung zu unterdrücken.
      reducedMotion={process.env.NODE_ENV === "production" ? "user" : "never"}
    >
      {children}
    </MotionConfig>
  );
}
