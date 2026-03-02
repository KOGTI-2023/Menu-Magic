"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Image from "next/image";

// Lazy load Lottie to reduce initial JS bundle size
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

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
  const [lottieData, setLottieData] = useState<any>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // In a real scenario, fetch the Lottie JSON from public/assets/intro/intro-animation.lottie.json
    // For this component, we simulate the fetch or use a fallback if it fails.
    fetch('/assets/intro/intro-animation.lottie.json')
      .then((res) => res.json())
      .then((data) => setLottieData(data))
      .catch(() => {
        // Fallback or ignore if file doesn't exist yet
        console.warn("Lottie animation not found, falling back to static logo.");
      });
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      handleComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isVisible, durationMs]);

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 800); // Wait for fade out animation
  };

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
            {prefersReducedMotion || !lottieData ? (
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
            ) : (
              <Lottie
                animationData={lottieData}
                loop={false}
                autoplay={true}
                className="w-full h-full"
                aria-hidden="true"
              />
            )}
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
