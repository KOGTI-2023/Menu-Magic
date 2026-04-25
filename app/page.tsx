"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { 
  UploadCloud, 
  FileText, 
  Loader2, 
  Download, 
  RefreshCw, 
  Palette, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Settings2, 
  Sparkles,
  Zap,
  ShieldCheck,
  Layout,
  Mic,
  Send,
  MessageSquare,
  Eye,
  EyeOff,
  History,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { convertPdfToImages, OptimizationOptions } from "@/lib/pdf-utils";
import { logger } from "@/lib/logger";
import { safeFetch } from "@/lib/apiClient";
import { extractMenuData, MenuData } from "@/lib/gemini";
import { MenuPreview, MenuTheme } from "@/components/menu-preview";
import { CostTracker, TokenUsage } from "@/components/cost-tracker";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { cn } from "@/lib/utils";

import { ConfirmModal, Warning, Thumbnail, Config } from "@/components/ConfirmModal";
import { getLocalPresets, saveLocalPreset, getActivePreset } from "@/lib/presets";
import { IntroSplash } from "@/components/IntroSplash";
import { saveSession, getSession, getAllSessionsMetadata, deleteSession, SessionMetadata } from "@/lib/storage";

type Step = "UPLOAD" | "OPTIMIZE" | "PROCESS" | "RESULT" | "GALLERY";

export default function Home() {
  const [step, setStep] = useState<Step>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState<string>("gemini-3.1-pro-preview");
  const [detailLevel, setDetailLevel] = useState<string>("premium");
  const [theme, setTheme] = useState<MenuTheme>("original");
  const [containerStyle, setContainerStyle] = useState<string>("bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimizedImages, setOptimizedImages] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showRepairMetadata, setShowRepairMetadata] = useState(false);
  const [optimizationOptions, setOptimizationOptions] = useState<OptimizationOptions>({
    intensity: 'medium',
    deskew: true,
    rotationAngle: 0,
    grayscale: true
  });
  const [aiCommand, setAiCommand] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isEditable, setIsEditable] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [thinkingLevel, setThinkingLevel] = useState<"FAST" | "BALANCED" | "MAX">("BALANCED");
  const [lastUsage, setLastUsage] = useState<TokenUsage>({ promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 });
  const [sessionUsage, setSessionUsage] = useState<TokenUsage>({ promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 });
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'info' | 'error' | 'success' }[]>([]);

  // ConfirmModal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [modalConfig, setModalConfig] = useState<Config>({ model: "gemini-3.1-pro-preview", detailLevel: "premium", style: "original" });
  const [activePresetName, setActivePresetName] = useState<string | null>(null);
  const [cancelTimeoutId, setCancelTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Storage State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gallerySessions, setGallerySessions] = useState<SessionMetadata[]>([]);

  useEffect(() => {
    // Check if user has already seen the intro this session
    const hasSeenIntro = sessionStorage.getItem("menuMagicIntroSeen");
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  useEffect(() => {
    const preset = getActivePreset();
    if (preset) {
      setActivePresetName(preset.name);
      setModel(preset.config.model);
      setDetailLevel(preset.config.detailLevel);
      setTheme(preset.config.style as MenuTheme);
      setModalConfig(preset.config);
    }
    
    // Load gallery sessions on mount
    getAllSessionsMetadata().then(setGallerySessions);
  }, []);

  // Save session state when important data changes
  useEffect(() => {
    if (sessionId && file) {
      saveSession({
        id: sessionId,
        fileName: file.name,
        updatedAt: Date.now(),
        step,
        optimizedImages,
        originalImages,
        menuData
      }).then(() => {
        // Update gallery list
        getAllSessionsMetadata().then(setGallerySessions);
      });
    }
  }, [sessionId, file, step, optimizedImages, originalImages, menuData]);

  const addNotification = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const handleMenuUpdate = useCallback((updatedData: MenuData) => {
    setMenuData(prev => {
      if (!prev) return updatedData;
      
      if (selectedCategory) {
        const catIndex = prev.categories.findIndex(c => c.category === selectedCategory);
        if (catIndex === -1) return updatedData;

        const newCategories = [...prev.categories];
        newCategories[catIndex] = updatedData.categories[0];

        if (updatedData.categories[0].category !== selectedCategory) {
          setTimeout(() => setSelectedCategory(updatedData.categories[0].category), 0);
        }

        return { ...updatedData, categories: newCategories };
      }
      
      return updatedData;
    });
    
    addNotification("Änderung gespeichert", "success");
  }, [selectedCategory, addNotification]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setError("Spracherkennung wird von deinem Browser nicht unterstützt.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiCommand(transcript);
    };
    recognition.start();
  };

  const handleAiCommand = async () => {
    if (!aiCommand.trim() || !menuData) return;
    
    setIsAiProcessing(true);
    setError(null);
    try {
      const result = await safeFetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentData: menuData,
          prompt: aiCommand,
          thinkingLevel: "BALANCED" // Assistant uses moderate reasoning
        }),
        timeout: 60000
      });

      if (!result.success) {
        throw new Error(result.error?.message || "Fehler bei der Server-Verarbeitung");
      }
      
      if (result.usage) {
        setLastUsage(result.usage);
        setSessionUsage(prev => ({
          promptTokenCount: prev.promptTokenCount + (result.usage.promptTokenCount || 0),
          candidatesTokenCount: prev.candidatesTokenCount + (result.usage.candidatesTokenCount || 0),
          totalTokenCount: prev.totalTokenCount + (result.usage.totalTokenCount || 0)
        }));
      }
      
      setMenuData(result.data);
      setAiCommand("");
      addNotification("Design erfolgreich angepasst!", "success");
    } catch (err: any) {
      const errorMessage = err.message || "Unbekannter Fehler aufgetreten.";
      if (errorMessage.includes("429") || errorMessage.includes("Rate-Limit")) {
        setError("Die KI ist derzeit überlastet. Bitte warte einen Moment und versuche es erneut.");
      } else if (errorMessage.includes("400") || errorMessage.includes("ungültig")) {
        setError("Die Anfrage war ungültig. Bitte formuliere deinen Wunsch etwas anders.");
      } else {
        setError(`KI-Assistent Fehler: ${errorMessage}. Bitte versuche es noch einmal.`);
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleUpgradeDetail = async () => {
    if (!menuData) return;
    setIsAiProcessing(true);
    setError(null);
    try {
      const result = await safeFetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentData: menuData,
          prompt: "Überarbeite alle Gerichte in dieser Speisekarte und hebe die Detailstufe auf 'Premium' an. Formuliere die Beschreibungen extrem appetitanregend, hochklassig und professionell. Verändere keine Preise oder Zutaten, sondern nur die werbliche Beschreibung."
        }),
        timeout: 60000
      });

      if (!result.success) {
        throw new Error(result.error?.message || "Fehler bei der Server-Verarbeitung");
      }
      
      if (result.usage) {
        setLastUsage(result.usage);
        setSessionUsage(prev => ({
          promptTokenCount: prev.promptTokenCount + (result.usage.promptTokenCount || 0),
          candidatesTokenCount: prev.candidatesTokenCount + (result.usage.candidatesTokenCount || 0),
          totalTokenCount: prev.totalTokenCount + (result.usage.totalTokenCount || 0)
        }));
      }
      
      setMenuData(result.data);
      addNotification("Texte wurden auf Premium-Niveau angehoben!", "success");
    } catch (err: any) {
      const errorMessage = err.message || "Unbekannter Fehler aufgetreten.";
      if (errorMessage.includes("429") || errorMessage.includes("Rate-Limit")) {
        setError("Die KI ist derzeit überlastet. Bitte warte einen Moment und versuche es erneut.");
      } else {
        setError(`Upgrade Fehler: ${errorMessage}. Bitte versuche es noch einmal.`);
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setMenuData(null);
      setError(null);
      setIsProcessing(true);
      setStatus("Analysiere PDF...");
      setSessionId(Math.random().toString(36).substring(2) + Date.now().toString(36));

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const result = await safeFetch('/api/upload', {
          method: 'POST',
          body: formData,
          timeout: 60000
        });

        if (!result.success) {
          const errorMsg = result.error?.message || result.error || 'Fehler bei der Analyse';
          throw new Error(errorMsg);
        }

        const { warnings: uploadWarnings, thumbnails: uploadThumbnails } = result.data;
        setWarnings(uploadWarnings || []);
        setThumbnails(uploadThumbnails || []);
        setModalConfig({ model, detailLevel, style: theme });
        setIsConfirmModalOpen(true);
      } catch (err: any) {
        logger.error("Upload/Analysis failed:", err);
        setError(err.message || "Ein unerwarteter Fehler ist beim Hochladen aufgetreten.");
        addNotification("Upload fehlgeschlagen", "error");
      } finally {
        setIsProcessing(false);
      }
    }
  }, [model, detailLevel, theme, addNotification]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: step !== "UPLOAD"
  });

  const handleConfirmModal = async (override: boolean, savePreset: boolean, presetScope: 'session' | 'device' | 'account') => {
    setIsConfirmModalOpen(false);
    setModel(modalConfig.model);
    setDetailLevel(modalConfig.detailLevel);
    setTheme(modalConfig.style as MenuTheme);

    if (savePreset) {
      const newPreset = {
        id: Date.now().toString(),
        name: `Preset ${new Date().toLocaleDateString()}`,
        config: modalConfig,
        scope: presetScope
      };
      saveLocalPreset(newPreset);
      setActivePresetName(newPreset.name);
      
      // If authenticated, also save via API
      // fetch('/api/presets', { method: 'POST', body: JSON.stringify({ preset: newPreset }) });
    }

    setStep("PROCESS");
    setIsProcessing(true);
    setStatus("Optimierung startet in 5 Sekunden... (Abbrechen möglich)");
    setIsCancelling(false);
    setProgress(5);

    const timeoutId = setTimeout(async () => {
      setCancelTimeoutId(null);
      setStatus("Optimiere PDF...");
      setProgress(10);
      logger.info("Starting optimization API call...");
      try {
        const result = await safeFetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confirmedConfig: modalConfig,
            userAcceptedWarnings: true,
            overrideCritical: override
          }),
          timeout: 20000 // 20s timeout for optimization start
        });

        logger.info("Optimization API response received:", result);

        if (!result.success) {
          throw new Error(result.error?.message || result.error || 'Fehler bei der Optimierung');
        }

        // Proceed to actual processing
        logger.info("Proceeding to PDF-to-Image conversion...");
        await handleOptimize(true); 
      } catch (err: any) {
        logger.error("Optimization start failed:", err);
        setError(err.message || "Fehler beim Starten der Optimierung.");
        setIsProcessing(false);
        setStep("UPLOAD");
        addNotification("Optimierung konnte nicht gestartet werden", "error");
      }
    }, 5000);

    setCancelTimeoutId(timeoutId);
  };

  const handleCancelOptimization = () => {
    if (cancelTimeoutId) {
      clearTimeout(cancelTimeoutId);
      setCancelTimeoutId(null);
    }
    setIsProcessing(false);
    setStep("UPLOAD");
    setIsConfirmModalOpen(true);
  };

  const handleProcess = useCallback(async (imagesToProcess?: string[]) => {
    const images = imagesToProcess || optimizedImages;
    if (images.length === 0) {
      logger.warn("handleProcess called with 0 optimized images");
      return;
    }

    setStep("PROCESS");
    setIsProcessing(true);
    setError(null);
    setProgress(10);
    setStatus("Preparing images for analysis...");
    logger.info(`Starting AI analysis for ${images.length} pages...`);

    try {
      setProgress(40);
      setStatus("Analyzing structure with AI...");
      logger.info("Sending request to /api/analyze...");
      
      const result = await safeFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images,
          model,
          detailLevel,
          thinkingLevel
        }),
        timeout: 180000 // 3 minute timeout for Gemini analysis
      });

      logger.info("AI analysis response received:", result.success ? "Success" : "Failure");
      
      if (!result.success) {
        throw new Error(result.error?.message || result.error || "Fehler bei der internen Verarbeitung");
      }
      
      if (result.usage) {
        setLastUsage(result.usage);
        setSessionUsage(prev => ({
          promptTokenCount: prev.promptTokenCount + (result.usage.promptTokenCount || 0),
          candidatesTokenCount: prev.candidatesTokenCount + (result.usage.candidatesTokenCount || 0),
          totalTokenCount: prev.totalTokenCount + (result.usage.totalTokenCount || 0)
        }));
      }
      
      const data = result.data;
      
      setProgress(70);
      setStatus("Generating preview...");

      if (!data) {
        throw new Error("Keine Daten von der Gemini API erhalten.");
      }
      
      if (!data.categories || !Array.isArray(data.categories)) {
        logger.warn("Invalid categories received, using fallback structure");
        addNotification("KI-Analyse war unvollständig, Fallback-Modus aktiv.", "error");
      }
      
      setProgress(90);
      setStatus("Finalizing export...");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(100);
      setMenuData(data);
      setStep("RESULT");
      addNotification("Speisekarte erfolgreich verarbeitet!", "success");
    } catch (err: any) {
      logger.error("AI Analysis failed:", err);
      setError(err.message || "Ein Fehler ist während der KI-Analyse aufgetreten.");
      setStep("UPLOAD");
      addNotification("KI-Analyse fehlgeschlagen", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [optimizedImages, model, detailLevel, thinkingLevel, addNotification]);

  const handleOptimize = useCallback(async (autoProceed: boolean = false) => {
    if (!file) {
      logger.warn("handleOptimize called without file");
      return;
    }
    setIsProcessing(true);
    setStatus("Converting PDF to images...");
    logger.info("Starting PDF to Image conversion...");
    try {
      // Add a timeout for the entire conversion process (e.g., 5 minutes)
      const conversionPromise = convertPdfToImages(file, optimizationOptions, (current, total) => {
        const p = Math.round((current / total) * 30) + 10; // 10% to 40%
        setProgress(p);
        setStatus(`Converting PDF to images (Page ${current} of ${total})...`);
        logger.info(`PDF Conversion Progress: ${current}/${total}`);
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Die PDF-Verarbeitung hat zu lange gedauert (Timeout).")), 300000)
      );

      const results = await Promise.race([conversionPromise, timeoutPromise]) as any[];
      
      logger.info(`PDF conversion successful. Generated ${results.length} images.`);
      const optimized = results.map(r => r.optimized);
      const originals = results.map(r => r.original);
      
      setOptimizedImages(optimized);
      setOriginalImages(originals);
      
      if (autoProceed) {
        logger.info("Auto-proceeding to AI analysis...");
        handleProcess(optimized);
      }
    } catch (err: any) {
      logger.error("Optimization failed:", err);
      setError(`Optimierung fehlgeschlagen: ${err.message}`);
      setStep("UPLOAD");
      addNotification("PDF-Verarbeitung fehlgeschlagen", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [file, optimizationOptions, handleProcess, addNotification]);

  // Re-run optimization when options change
  const prevOptionsRef = useRef(optimizationOptions);
  const prevFileRef = useRef(file);

  useEffect(() => {
    if (file && step === "OPTIMIZE") {
      const optionsChanged = prevOptionsRef.current !== optimizationOptions;
      const fileChanged = prevFileRef.current !== file;
      
      if (optionsChanged || fileChanged || optimizedImages.length === 0) {
        handleOptimize();
        prevOptionsRef.current = optimizationOptions;
        prevFileRef.current = file;
      }
    }
  }, [optimizationOptions, file, step, handleOptimize, optimizedImages.length]);

  const handleDownloadPdf = async () => {
    try {
      const element = document.getElementById("menu-preview-container");
      if (!element) {
        throw new Error("Vorschau-Container nicht gefunden.");
      }
      
      setStatus("PDF wird generiert...");
      setIsProcessing(true);
      
      // Disable editing mode for export
      const wasEditable = isEditable;
      setIsEditable(false);
      
      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 100));

      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: 10,
        filename: 'speisekarte.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      await html2pdf().set(opt).from(element).save();
      
      if (wasEditable) setIsEditable(true);
    } catch (err: any) {
      logger.error("Error generating PDF:", err);
      setError(`Fehler beim Erstellen der PDF: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
      setStatus("");
    }
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem("menuMagicIntroSeen", "true");
    setShowIntro(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      {showIntro && (
        <IntroSplash 
          autoPlay={true} 
          showSkip={true} 
          onComplete={handleIntroComplete} 
          durationMs={5000} 
        />
      )}

      <div className={cn("transition-opacity duration-1000", !showIntro ? "opacity-100" : "opacity-0")}>
        <CostTracker usage={lastUsage} sessionUsage={sessionUsage} isProcessing={isProcessing || isAiProcessing} model={model} />
      
      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={cn(
                "px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 min-w-[300px]",
                n.type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                n.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                "bg-zinc-900/80 border-white/10 text-zinc-300"
              )}
            >
              {n.type === 'error' ? <AlertTriangle className="h-4 w-4" /> :
               n.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
               <Sparkles className="h-4 w-4" />}
              <span className="text-sm font-medium">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto min-h-screen flex flex-col justify-center gap-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-16 h-16 md:w-20 md:h-20"
            >
              <Image 
                src="/assets/logo/logo-mark.svg" 
                alt="Menü Magie Logo" 
                fill 
                className="object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                priority
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-indigo-300 mb-2">
                <Sparkles className="h-3 w-3" />
                <span>Powered by {model.includes('flash') ? 'Gemini 3 Flash AI' : 'Gemini 3.1 Pro AI'}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                Menü Magie
              </h1>
            </div>
          </div>
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Verwandle unleserliche PDF-Scans in professionelle, hochglänzende und druckfertige Speisekarten – mit nur einem Klick.
          </p>
          {activePresetName && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 mt-2">
              <CheckCircle2 className="h-3 w-3" />
              <span>Preset geladen: {activePresetName}</span>
            </div>
          )}
        </motion.div>

        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-3 max-w-md mx-auto">
          {(["UPLOAD", "OPTIMIZE", "PROCESS", "RESULT"] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 text-sm md:text-base",
                step === s ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.4)]" : 
                (["UPLOAD", "OPTIMIZE", "PROCESS", "RESULT"].indexOf(step) > i) ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" :
                "border-zinc-800 bg-zinc-900 text-zinc-600"
              )}>
                { (["UPLOAD", "OPTIMIZE", "PROCESS", "RESULT"].indexOf(step) > i) ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> : i + 1 }
              </div>
              {i < 3 && <div className={cn("h-0.5 w-6 md:w-8 rounded-full", (["UPLOAD", "OPTIMIZE", "PROCESS", "RESULT"].indexOf(step) > i) ? "bg-emerald-500/50" : "bg-zinc-800")} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "UPLOAD" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="text-center pb-0">
                  <CardTitle className="text-xl text-white">Datei hochladen</CardTitle>
                  <CardDescription className="text-zinc-500 text-sm">Wähle deine PDF-Speisekarte aus</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center p-10 space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <p className="text-zinc-400">{status}</p>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className={cn(
                        "group relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-500 overflow-hidden",
                        isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-800 hover:border-zinc-700 bg-black/20"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <input {...getInputProps()} />
                      <UploadCloud className="mx-auto h-12 w-12 text-zinc-600 group-hover:text-indigo-400 transition-colors mb-4" />
                      <p className="text-zinc-400 text-base font-medium group-hover:text-zinc-200 transition-colors">
                        PDF hierher ziehen oder klicken
                      </p>
                      <p className="text-zinc-600 text-xs mt-2">Maximal 1 Datei (PDF)</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-400">KI-Modell</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger className="bg-black/40 border-white/5 text-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                          <SelectItem value="gemini-2.5-flash-lite" description="Sehr schnell, geringere Kosten. Ideal für einfache Layouts.">Flash Lite (Schnell)</SelectItem>
                          <SelectItem value="gemini-2.5-flash" description="Gute Balance aus Geschwindigkeit und Qualität.">Flash (Ausgewogen)</SelectItem>
                          <SelectItem value="gemini-3.1-pro-preview" description="Maximale Qualität und Detailtreue. Empfohlen für komplexe Karten.">Pro (Beste Qualität)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Detailstufe</Label>
                      <Select value={detailLevel} onValueChange={setDetailLevel}>
                        <SelectTrigger className="bg-black/40 border-white/5 text-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                          <SelectItem value="standard">Standard (Originalgetreu)</SelectItem>
                          <SelectItem value="high">Hoch (Appetitanregend)</SelectItem>
                          <SelectItem value="premium">Premium (Hochglanz)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Standard-Stil</Label>
                      <Select value={theme} onValueChange={(v) => setTheme(v as MenuTheme)}>
                        <SelectTrigger className="bg-black/40 border-white/5 text-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                          <SelectItem value="original">Original (Restauration)</SelectItem>
                          <SelectItem value="premium">Premium Glossy</SelectItem>
                          <SelectItem value="orchidee">Orchidee</SelectItem>
                          <SelectItem value="dark">Midnight Gold</SelectItem>
                          <SelectItem value="modern">Modern Bold</SelectItem>
                          <SelectItem value="elegant">Elegant Serif</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                          <SelectItem value="artdeco">Art Deco</SelectItem>
                          <SelectItem value="abstract">Abstract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {gallerySessions.length > 0 && (
                    <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        variant="outline" 
                        className="bg-zinc-900/50 border-white/10 hover:bg-white/10 text-zinc-300"
                        onClick={() => setStep("GALLERY")}
                      >
                        <History className="w-4 h-4 mr-2" />
                        Galerie ({gallerySessions.length})
                      </Button>
                      
                      {gallerySessions[0] && (
                        <Button 
                          variant="default" 
                          className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30"
                          onClick={async () => {
                            const session = await getSession(gallerySessions[0].id);
                            if (session) {
                              setSessionId(session.id);
                              setOptimizedImages(session.optimizedImages || []);
                              setMenuData(session.menuData);
                              setStep(session.step === 'UPLOAD' ? 'OPTIMIZE' : session.step);
                              addNotification("Letzte Sitzung wiederhergestellt", "success");
                            }
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Letzte Sitzung fortsetzen
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "GALLERY" && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl mx-auto w-full"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <History className="w-6 h-6 text-indigo-400" />
                  Vergangene Sitzungen
                </h2>
                <Button 
                  variant="outline" 
                  className="bg-zinc-900/50 border-white/10 hover:bg-white/10 text-zinc-300"
                  onClick={() => setStep("UPLOAD")}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
              </div>

              {gallerySessions.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl">
                  <History className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">Keine vergangenen Sitzungen gefunden.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gallerySessions.map(session => (
                    <Card key={session.id} className="bg-zinc-900/40 backdrop-blur-xl border-white/10 overflow-hidden group hover:border-indigo-500/50 transition-all">
                      {session.thumbnail && (
                        <div className="h-40 w-full relative overflow-hidden bg-black/50">
                          <Image 
                            src={`data:image/jpeg;base64,${session.thumbnail}`} 
                            alt="Thumbnail" 
                            fill
                            className="object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white border border-white/10">
                            {session.pageCount} Seiten
                          </div>
                        </div>
                      )}
                      <CardContent className="p-5">
                        <h3 className="font-medium text-white truncate mb-1" title={session.fileName}>{session.fileName}</h3>
                        <p className="text-xs text-zinc-500 mb-4">
                          {new Date(session.updatedAt).toLocaleString('de-DE')}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                            Status: {session.step}
                          </span>
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                            onClick={async () => {
                              const fullSession = await getSession(session.id);
                              if (fullSession) {
                                setSessionId(fullSession.id);
                                setOptimizedImages(fullSession.optimizedImages || []);
                                setOriginalImages(fullSession.originalImages || []);
                                setMenuData(fullSession.menuData);
                                setStep(fullSession.step === 'UPLOAD' ? 'OPTIMIZE' : fullSession.step);
                                addNotification("Sitzung geladen", "success");
                              }
                            }}
                          >
                            Laden
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === "OPTIMIZE" && (
            <motion.div
              key="optimize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Controls */}
                <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Settings2 className="h-5 w-5 text-indigo-400" />
                      Optimierung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-zinc-400">Intensität</Label>
                        <span className="text-xs font-medium text-indigo-400 capitalize">
                          {optimizationOptions.intensity === 'low' ? 'Leicht' : optimizationOptions.intensity === 'medium' ? 'Mittel' : 'Stark'}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="2" 
                        step="1"
                        value={optimizationOptions.intensity === 'low' ? 0 : optimizationOptions.intensity === 'medium' ? 1 : 2}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const level = val === 0 ? 'low' : val === 1 ? 'medium' : 'high';
                          setOptimizationOptions(prev => ({ ...prev, intensity: level }));
                        }}
                        className="w-full accent-indigo-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
                        <span>Leicht</span>
                        <span>Mittel</span>
                        <span>Stark</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-zinc-300">Manuelle Drehung (Rotation)</Label>
                          <span className="text-xs text-zinc-500">{optimizationOptions.rotationAngle}°</span>
                        </div>
                        <input 
                          type="range" 
                          min="-15" 
                          max="15" 
                          step="0.5"
                          value={optimizationOptions.rotationAngle}
                          onChange={(e) => setOptimizationOptions(prev => ({ ...prev, rotationAngle: parseFloat(e.target.value) }))}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-zinc-300">Automatische Grundlinienkorrektur (Deskew)</Label>
                        <div 
                          className={cn("w-12 h-6 rounded-full p-1 cursor-pointer transition-colors", optimizationOptions.deskew ? "bg-emerald-500" : "bg-zinc-800")}
                          onClick={() => setOptimizationOptions(prev => ({ ...prev, deskew: !prev.deskew }))}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", optimizationOptions.deskew ? "translate-x-6" : "translate-x-0")} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-zinc-300">Graustufen</Label>
                        <div 
                          className={cn("w-12 h-6 rounded-full p-1 cursor-pointer transition-colors", optimizationOptions.grayscale ? "bg-emerald-500" : "bg-zinc-800")}
                          onClick={() => setOptimizationOptions(prev => ({ ...prev, grayscale: !prev.grayscale }))}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", optimizationOptions.grayscale ? "translate-x-6" : "translate-x-0")} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <Label className="text-zinc-300">KI-Denktiefe (Reasoning)</Label>
                      <Select value={thinkingLevel} onValueChange={(v: any) => setThinkingLevel(v)}>
                        <SelectTrigger className="bg-black/40 border-white/5 text-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                          <SelectItem value="FAST">Fast (Schnell, geringe Kosten)</SelectItem>
                          <SelectItem value="BALANCED">Balanced (Ausgewogen, Standard)</SelectItem>
                          <SelectItem value="MAX">Max (Tiefgreifende Struktur-Analyse)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        {thinkingLevel === 'FAST' && 'Optimiert für Geschwindigkeit. Keine tiefgehende Rekonstruktion.'}
                        {thinkingLevel === 'BALANCED' && 'Gute Balance aus Geschwindigkeit und Genauigkeit.'}
                        {thinkingLevel === 'MAX' && 'Maximale Präzision. Löst komplexe Layouts auf, benötigt aber mehr Zeit und Tokens.'}
                      </p>
                    </div>

                    <div className="pt-6 space-y-3">
                      <Button 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 h-12 text-lg font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={() => handleProcess()}
                        disabled={isProcessing || optimizedImages.length === 0}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Verarbeite...
                          </>
                        ) : (
                          <>
                            Bestätigen & Optimieren
                            <ChevronRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" className="w-full text-zinc-500 hover:text-zinc-300" onClick={() => setStep("UPLOAD")}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Zurück
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between px-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium text-zinc-400">Vorschau der Optimierung</h3>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Ziehe den Slider zum Vergleichen</p>
                    </div>
                    <span className="text-xs text-zinc-600 uppercase tracking-widest">Live Rendering</span>
                  </div>
                  <div className="h-[600px] bg-zinc-900/60 rounded-3xl border border-white/5 overflow-hidden relative group flex flex-col">
                    {isProcessing ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                        <p className="text-indigo-300 font-medium animate-pulse">Lade & bereite Vorschau vor...</p>
                      </div>
                    ) : optimizedImages.length > 0 ? (
                      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                        {optimizedImages.map((img, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <BeforeAfterSlider 
                              beforeImage={originalImages[i] || img}
                              afterImage={img}
                              className="w-full shadow-2xl"
                            />
                            <p className="text-center text-xs text-zinc-600 mt-2 uppercase tracking-widest">Seite {i + 1}</p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-zinc-700 italic">
                        Keine Vorschau verfügbar
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "PROCESS" && (
            <motion.div
              key="process"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-xl mx-auto text-center space-y-12 py-20"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse" />
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-zinc-800"
                    />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={552}
                      initial={{ strokeDashoffset: 552 }}
                      animate={{ strokeDashoffset: 552 - (552 * progress) / 100 }}
                      className="text-indigo-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Zap className="h-12 w-12 text-indigo-400 animate-bounce mb-2" />
                    <span className="text-2xl font-bold text-white">{progress}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight max-w-3xl mx-auto px-4">{status}</h2>
                <div className="max-w-md mx-auto">
                  <Progress value={progress} className="h-1 bg-zinc-800" />
                </div>
                <p className="text-zinc-500 font-light max-w-sm mx-auto">
                  {progress < 40 ? "Converting PDF to images..." : 
                   progress < 70 ? "Analyzing structure with AI..." :
                   progress < 90 ? "Generating preview..." :
                   "Finalizing export..."}
                </p>
              </div>

              <div className="flex justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  <span className="text-xs text-zinc-500 uppercase tracking-tighter">Sichere Analyse</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Layout className="h-6 w-6 text-purple-500" />
                  <span className="text-xs text-zinc-500 uppercase tracking-tighter">Layout Engine</span>
                </div>
              </div>

              {cancelTimeoutId && (
                <div className="mt-8">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelOptimization}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Abbrechen
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {step === "RESULT" && menuData && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl sticky top-8 z-50 shadow-2xl">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-indigo-400" />
                    <Select value={theme} onValueChange={(v) => setTheme(v as MenuTheme)}>
                      <SelectTrigger className="w-[180px] bg-black/40 border-white/5 text-zinc-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                        <SelectItem value="original">Original (Restauration)</SelectItem>
                        <SelectItem value="premium">Premium Glossy</SelectItem>
                        <SelectItem value="orchidee">Orchidee</SelectItem>
                        <SelectItem value="dark">Midnight Gold</SelectItem>
                        <SelectItem value="modern">Modern Bold</SelectItem>
                        <SelectItem value="elegant">Elegant Serif</SelectItem>
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="rustic">Rustic</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                        <SelectItem value="artdeco">Art Deco</SelectItem>
                        <SelectItem value="abstract">Abstract</SelectItem>
                        <SelectItem value="handdrawn">Handdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Layout className="h-5 w-5 text-emerald-400" />
                    <Select value={containerStyle} onValueChange={setContainerStyle}>
                      <SelectTrigger className="w-[180px] bg-black/40 border-white/5 text-zinc-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                        <SelectItem value="bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl">Glassmorphism</SelectItem>
                        <SelectItem value="bg-white text-black rounded-none shadow-none">Papier (Weiß)</SelectItem>
                        <SelectItem value="bg-stone-900 text-stone-100 rounded-xl">Dark Card</SelectItem>
                        <SelectItem value="bg-transparent">Transparent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    className={cn(
                      "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                      isEditable && "bg-amber-500/20 border-amber-500/50 text-amber-300"
                    )}
                    onClick={() => setIsEditable(!isEditable)}
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    {isEditable ? "Bearbeiten beenden" : "Direkt bearbeiten"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                      showRepairMetadata && "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                    )}
                    onClick={() => setShowRepairMetadata(!showRepairMetadata)}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Reparatur-Infos
                  </Button>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                      showComparison && "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                    )}
                    onClick={() => setShowComparison(!showComparison)}
                  >
                    {showComparison ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    Vergleich
                  </Button>
                  <Button variant="outline" className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10" onClick={() => setStep("UPLOAD")}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Neu starten
                  </Button>
                  <Button 
                    onClick={handleUpgradeDetail}
                    disabled={isAiProcessing}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  >
                    {isAiProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Texte auf Premium aufwerten
                  </Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]" onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" />
                    PDF Exportieren
                  </Button>
                </div>
              </div>

              {/* Suggested Palettes */}
              {menuData.suggestedPalettes && menuData.suggestedPalettes.length > 0 && (
                <div className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Palette className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-medium text-zinc-300">Vorgeschlagene Farbpaletten</h3>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {menuData.suggestedPalettes.map((palette, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setMenuData({ ...menuData, originalStyle: palette });
                          setTheme("original");
                        }}
                        className="group relative flex items-center gap-2 p-2 rounded-xl border border-white/5 hover:border-white/20 transition-all bg-black/20"
                      >
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: palette.primaryColor }} />
                          <div className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: palette.backgroundColor }} />
                          <div className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: palette.textColor }} />
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-200">Palette {i + 1}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setTheme("original")}
                      className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                    >
                      Original wiederherstellen
                    </button>
                  </div>
                </div>
              )}

              {/* AI Assistant */}
              <div className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-lg font-medium text-zinc-300">KI-Design-Assistent</h3>
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input 
                      placeholder="z.B. 'Erhöhe alle Pizza-Preise um 1€' oder 'Verschiebe Desserts nach oben'..."
                      value={aiCommand}
                      onChange={(e) => setAiCommand(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
                      className="pr-10"
                      disabled={isAiProcessing}
                    />
                    <button 
                      onClick={startListening}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-indigo-400 transition-colors",
                        isListening && "text-red-500 animate-pulse"
                      )}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>
                  <Button 
                    onClick={handleAiCommand} 
                    disabled={isAiProcessing || !aiCommand.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500"
                  >
                    {isAiProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {isAiProcessing && (
                  <div className="flex items-center gap-2 mt-2 text-indigo-400 text-sm animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>KI denkt nach...</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-zinc-500">Vorschläge:</span>
                  <button onClick={() => setAiCommand("Preise um 10% erhöhen")} className="text-xs text-indigo-400 hover:underline">Preise +10%</button>
                  <button onClick={() => setAiCommand("Schriftart auf modern ändern")} className="text-xs text-indigo-400 hover:underline">Modernere Schrift</button>
                  <button onClick={() => setAiCommand("Überschriften in Dunkelrot")} className="text-xs text-indigo-400 hover:underline">Dunkelrote Titel</button>
                </div>
              </div>

              {/* Preview Area */}
              <div className="relative group">
                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                  <Button 
                    variant={selectedCategory === null ? "default" : "outline"} 
                    onClick={() => setSelectedCategory(null)}
                    className={cn("whitespace-nowrap rounded-full", selectedCategory === null ? "bg-indigo-600" : "border-white/10 bg-black/20 text-zinc-400")}
                  >
                    Alle Kategorien
                  </Button>
                  {menuData.categories.map(c => (
                    <Button 
                      key={c.category}
                      variant={selectedCategory === c.category ? "default" : "outline"} 
                      onClick={() => setSelectedCategory(c.category)}
                      className={cn("whitespace-nowrap rounded-full", selectedCategory === c.category ? "bg-indigo-600" : "border-white/10 bg-black/20 text-zinc-400")}
                    >
                      {c.category}
                    </Button>
                  ))}
                </div>

                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative overflow-hidden rounded-3xl">
                  {showComparison ? (
                    <div className="relative h-[800px] w-full select-none overflow-hidden">
                      {/* Original (Before) */}
                      <div className="absolute inset-0">
                        <div className="h-full w-full overflow-y-auto p-8 bg-zinc-800 scrollbar-hide">
                          {(originalImages.length > 0 ? originalImages : optimizedImages).map((img, i) => (
                            <Image 
                              key={i} 
                              src={`data:image/jpeg;base64,${img}`} 
                              className="w-full mb-8 rounded-lg shadow-xl" 
                              alt={`Original Page ${i + 1}`} 
                              width={800}
                              height={1131}
                              style={{ objectFit: 'contain' }}
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Restored (After) */}
                      <div 
                        className="absolute inset-0 border-l-4 border-indigo-500 shadow-2xl z-10"
                        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                      >
                        <div className="h-full w-full overflow-y-auto bg-black scrollbar-hide">
                           <MenuPreview 
                             data={selectedCategory ? { ...menuData, categories: menuData.categories.filter(c => c.category === selectedCategory) } : menuData} 
                             theme={theme} 
                             className={cn(containerStyle, "min-h-full")} 
                             editable={isEditable}
                             onUpdate={handleMenuUpdate}
                             showRepairMetadata={showRepairMetadata}
                           />
                        </div>
                      </div>

                      {/* Slider Input (Invisible but covers the whole area) */}
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={sliderPosition} 
                        onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                        className="absolute inset-0 z-30 w-full h-full opacity-0 cursor-ew-resize"
                      />

                      {/* Slider Handle (Visual only) */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-indigo-500 z-20 pointer-events-none flex items-center justify-center transform -translate-x-1/2"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] border-2 border-white">
                          <div className="flex gap-0.5">
                            <ChevronLeft className="h-5 w-5 text-white" />
                            <ChevronRight className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest border border-white/10">Original</div>
                      <div className="absolute top-4 right-4 z-30 bg-indigo-600/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest border border-white/10">Optimiert</div>
                    </div>
                  ) : (
                    <MenuPreview 
                      data={selectedCategory ? { ...menuData, categories: menuData.categories.filter(c => c.category === selectedCategory) } : menuData} 
                      theme={theme} 
                      className={containerStyle} 
                      editable={isEditable}
                      onUpdate={handleMenuUpdate}
                      showRepairMetadata={showRepairMetadata}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-center font-medium backdrop-blur-md flex justify-between items-center"
          >
            <span className="flex-1">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 p-1 rounded-full hover:bg-red-500/20 transition-colors"
              aria-label="Fehler ausblenden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </motion.div>
        )}
      </main>

        {/* Footer */}
        <footer className="relative z-10 py-12 text-center border-t border-white/5 flex flex-col items-center gap-4">
          <div className="relative w-8 h-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <Image 
              src="/assets/logo/logo-mark.svg" 
              alt="Menü Magie Logo" 
              fill 
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-zinc-600 text-sm font-light tracking-widest uppercase">
            &copy; 2026 Menü Magie &bull; Powered by Google Gemini
          </p>
        </footer>

        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onOpenChange={setIsConfirmModalOpen}
          config={modalConfig}
          onConfigChange={setModalConfig}
          warnings={warnings}
          thumbnails={thumbnails}
          onConfirm={handleConfirmModal}
          onCancel={() => setIsConfirmModalOpen(false)}
        />
      </div>
    </div>
  );
}
