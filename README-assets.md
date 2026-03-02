# Menu Magic Assets & Brand Guidelines

This directory contains the production-ready visual assets for the **Menü Magie** application.

## 📁 Directory Structure

```text
public/assets/
├── logo/
│   ├── logo-primary.svg       # Full-color vector logo with logotype (light bg)
│   ├── logo-alt-dark.svg      # Full-color vector logo with logotype (dark bg)
│   ├── logo-monochrome.svg    # Single-color (black) variant for stamps/printing
│   └── logo-mark.svg          # Compact mark/icon (square) for favicons and social
└── intro/
    ├── intro-animation.lottie.json # Lightweight Lottie animation (4-7s)
    ├── intro-fallback.gif          # Fallback animated GIF (< 500KB)
    └── intro-preview.mp4           # Short MP4 preview for README
```

## 🎨 Asset Usage Notes

- **`logo-primary.svg`**: Use on light backgrounds (e.g., printed menus, light theme UI).
- **`logo-alt-dark.svg`**: Use on dark backgrounds (e.g., the main app interface, dark theme UI).
- **`logo-monochrome.svg`**: Use for high-contrast needs, receipts, or single-color printing.
- **`logo-mark.svg`**: Use for favicons, avatars, or when horizontal space is limited.

*Note: Raster exports (PNG/WebP) can be generated directly from these SVGs using tools like Figma or Illustrator at 1x, 2x, and 3x scales.*

## 🎬 IntroSplash Component Integration

The `IntroSplash` component is a Tailwind-ready React component that plays the Lottie animation on the first visit. It respects `prefers-reduced-motion` and includes an accessible "Skip" button.

### How to integrate into Next.js

1. Ensure you have `lottie-react` and `motion/react` installed:
   ```bash
   npm install lottie-react motion
   ```

2. Add the component to your main layout or page (e.g., `app/page.tsx`):

```tsx
"use client";

import { useState, useEffect } from "react";
import { IntroSplash } from "@/components/IntroSplash";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Check if user has already seen the intro this session
    const hasSeenIntro = sessionStorage.getItem("menuMagicIntroSeen");
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("menuMagicIntroSeen", "true");
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && (
        <IntroSplash 
          autoPlay={true} 
          showSkip={true} 
          onComplete={handleIntroComplete} 
          durationMs={5000} 
        />
      )}
      
      {/* Your main app content goes here */}
      <main className={!showIntro ? "opacity-100" : "opacity-0"}>
        {/* ... */}
      </main>
    </>
  );
}
```

## ♿ Accessibility & Performance

- **Lottie Optimization**: The Lottie JSON should be kept under 300KB.
- **Reduced Motion**: The `IntroSplash` component automatically detects `prefers-reduced-motion` via Framer Motion and falls back to a static `logo-mark.svg` fade-in.
- **Aria Labels**: All interactive elements (like the Skip button) have descriptive `aria-label` attributes in German ("Überspringen").
