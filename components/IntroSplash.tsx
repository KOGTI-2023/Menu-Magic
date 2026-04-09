"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

interface IntroSplashProps {
  autoPlay?: boolean;
  showSkip?: boolean;
  onComplete: () => void;
  durationMs?: number;
}

export function IntroSplash({
  autoPlay = true,
  showSkip = true,
  onComplete,
  durationMs = 5000,
}: IntroSplashProps) {
  const [isVisible, setIsVisible] = useState(autoPlay);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    setTimeout(onComplete, 800); // Wait for fade out animation
  }, [onComplete]);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      handleComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isVisible, durationMs, handleComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intro-splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, filter: "blur(10px)" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 text-zinc-50"
        role="dialog"
        aria-modal="true"
        aria-label="Menü Magie Intro"
      >
        <div className="relative flex flex-col items-center max-w-md w-full px-6 text-center">
          {/* Animation Container */}
          <div className="w-48 h-48 mb-8 relative flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <Image
                src="/assets/logo/logo-mark.svg"
                alt="Menü Magie Logo"
                width={120}
                height={120}
                priority
              />
            </motion.div>
          </div>

          {/* Typography */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Menü Magie
            </h1>
            <p className="text-zinc-400 text-sm md:text-base font-light leading-relaxed">
              Verwandle unscharfe Menüs in druckfertige, hochwertige Speisekarten — mit einem Klick.
            </p>
          </motion.div>
        </div>

        {/* Skip Button */}
        {showSkip && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            onClick={handleComplete}
            className="absolute bottom-12 px-6 py-2 rounded-full border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            aria-label="Intro überspringen"
          >
            Überspringen
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
