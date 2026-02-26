"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { extractMenuData, MenuData } from "@/lib/gemini";
import { MenuPreview, MenuTheme } from "@/components/menu-preview";
import { cn } from "@/lib/utils";

type Step = "UPLOAD" | "OPTIMIZE" | "PROCESS" | "RESULT";

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
  const [showComparison, setShowComparison] = useState(false);
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
  const [isEditable, setIsEditable] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'info' | 'error' | 'success' }[]>([]);

  const addNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

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
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API-Schlüssel fehlt.");
      }
      
      const { updateMenuData } = await import("@/lib/gemini");
      const updatedData = await updateMenuData(menuData, aiCommand, apiKey);
      setMenuData(updatedData);
      setAiCommand("");
    } catch (err: any) {
      setError(`KI-Assistent Fehler: ${err.message}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setMenuData(null);
      setError(null);
      setStep("OPTIMIZE");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: step !== "UPLOAD"
  });

  const handleOptimize = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const images = await convertPdfToImages(file, optimizationOptions);
      setOptimizedImages(images);
    } catch (err: any) {
      setError(`Optimierung fehlgeschlagen: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [file, optimizationOptions]);

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

  const handleProcess = async () => {
    if (optimizedImages.length === 0) return;

    setStep("PROCESS");
    setIsProcessing(true);
    setError(null);
    setProgress(10);
    setStatus("Schritt 1/4: Bilder werden vorbereitet...");

    try {
      if (optimizedImages.length > 10) {
        throw new Error("Zu viele Seiten (maximal 10 Seiten erlaubt). Bitte teile das PDF auf.");
      }

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API-Schlüssel fehlt. Bitte in den Umgebungsvariablen konfigurieren.");
      }

      setProgress(30);
      setStatus("Schritt 2/4: KI-Analyse wird gestartet...");
      
      const data = await extractMenuData(
        optimizedImages, 
        model, 
        apiKey, 
        detailLevel
      );
      
      setProgress(70);
      setStatus("Schritt 3/4: Daten werden validiert...");

      if (!data) {
        throw new Error("Keine Daten von der Gemini API erhalten.");
      }
      
      if (!data.categories || !Array.isArray(data.categories)) {
        console.warn("Invalid categories received, using fallback structure");
        addNotification("KI-Analyse war unvollständig, Fallback-Modus aktiv.", "error");
      }
      
      setProgress(90);
      setStatus("Schritt 4/4: Vorschau wird generiert...");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(100);
      setMenuData(data);
      setStep("RESULT");
      addNotification("Speisekarte erfolgreich verarbeitet!", "success");
    } catch (err: any) {
      console.error("Error in handleProcess:", err);
      // Extrahiere die eigentliche Fehlermeldung, falls sie in einem Error-Objekt verschachtelt ist
      const errorMessage = err instanceof Error ? err.message : 
                           (typeof err === 'object' && err !== null && 'message' in err) ? String(err.message) : 
                           String(err);
      
      setError(`Fehler bei der Verarbeitung: ${errorMessage}`);
      setStep("OPTIMIZE");
    } finally {
      setIsProcessing(false);
    }
  };

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
      console.error("Error generating PDF:", err);
      setError(`Fehler beim Erstellen der PDF: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
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

      <main className="relative z-10 p-6 md:p-12 lg:p-24 max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium text-indigo-300 mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Gemini 3.1 AI</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Menü Magie
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Verwandle unleserliche PDF-Scans in professionelle, hochglänzende und druckfertige Speisekarten – mit nur einem Klick.
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-4 max-w-md mx-auto">
          {(["UPLOAD", "OPTIMIZE", "PROCESS", "RESULT"] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                step === s ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.4)]" : 
                (["UPLOAD", "OPTIMIZE", "PROCESS", "RESULT"].indexOf(step) > i) ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" :
                "border-zinc-800 bg-zinc-900 text-zinc-600"
              )}>
                { (["UPLOAD", "OPTIMIZE", "PROCESS", "RESULT"].indexOf(step) > i) ? <CheckCircle2 className="h-6 w-6" /> : i + 1 }
              </div>
              {i < 3 && <div className={cn("h-0.5 w-8 rounded-full", (["UPLOAD", "OPTIMIZE", "PROCESS", "RESULT"].indexOf(step) > i) ? "bg-emerald-500/50" : "bg-zinc-800")} />}
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
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl text-white">Datei hochladen</CardTitle>
                  <CardDescription className="text-zinc-500">Wähle deine PDF-Speisekarte aus</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "group relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-500 overflow-hidden",
                      isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-800 hover:border-zinc-700 bg-black/20"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-16 w-16 text-zinc-600 group-hover:text-indigo-400 transition-colors mb-6" />
                    <p className="text-zinc-400 text-lg font-medium group-hover:text-zinc-200 transition-colors">
                      PDF hierher ziehen oder klicken
                    </p>
                    <p className="text-zinc-600 text-sm mt-2">Maximal 1 Datei (PDF)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-400">KI-Modell</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger className="bg-black/40 border-white/5 text-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                          <SelectItem value="gemini-2.5-flash-lite">Flash Lite (Schnell)</SelectItem>
                          <SelectItem value="gemini-2.5-flash">Flash (Ausgewogen)</SelectItem>
                          <SelectItem value="gemini-3.1-pro-preview">Pro (Beste Qualität)</SelectItem>
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
                </CardContent>
              </Card>
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
                      <Label className="text-zinc-400">Intensität</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                          <Button
                            key={level}
                            variant={optimizationOptions.intensity === level ? "default" : "outline"}
                            className={cn(
                              "capitalize",
                              optimizationOptions.intensity === level ? "bg-indigo-600" : "border-white/5 bg-black/20 text-zinc-400"
                            )}
                            onClick={() => setOptimizationOptions(prev => ({ ...prev, intensity: level }))}
                          >
                            {level === 'low' ? 'Leicht' : level === 'medium' ? 'Mittel' : 'Stark'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-zinc-300">Manuelle Drehung (Deskew)</Label>
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
                        <Label className="text-zinc-300">Begradigen</Label>
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

                    <div className="pt-6 space-y-3">
                      <Button 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 h-12 text-lg font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={handleProcess}
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
                    <h3 className="text-lg font-medium text-zinc-400">Vorschau der Optimierung</h3>
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
                          <motion.img 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            src={`data:image/jpeg;base64,${img}`} 
                            className="w-full rounded-xl shadow-2xl border border-white/10"
                            alt={`Seite ${i + 1}`}
                          />
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
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-16 w-16 text-indigo-400 animate-bounce" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">{status}</h2>
                <p className="text-zinc-500 font-light">Gemini analysiert die Struktur deiner Speisekarte...</p>
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
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-zinc-500">Vorschläge:</span>
                  <button onClick={() => setAiCommand("Preise um 10% erhöhen")} className="text-xs text-indigo-400 hover:underline">Preise +10%</button>
                  <button onClick={() => setAiCommand("Schriftart auf modern ändern")} className="text-xs text-indigo-400 hover:underline">Modernere Schrift</button>
                  <button onClick={() => setAiCommand("Überschriften in Dunkelrot")} className="text-xs text-indigo-400 hover:underline">Dunkelrote Titel</button>
                </div>
              </div>

              {/* Preview Area */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative overflow-hidden rounded-3xl">
                  {showComparison ? (
                    <div className="relative h-[800px] w-full select-none overflow-hidden">
                      {/* Original (Before) */}
                      <div className="absolute inset-0">
                        <div className="h-full w-full overflow-y-auto p-8 bg-zinc-800 scrollbar-hide">
                          {optimizedImages.map((img, i) => (
                            <img 
                              key={i} 
                              src={`data:image/jpeg;base64,${img}`} 
                              className="w-full mb-8 rounded-lg shadow-xl" 
                              alt={`Original Page ${i + 1}`} 
                              loading="lazy"
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
                             data={menuData} 
                             theme={theme} 
                             className={cn(containerStyle, "min-h-full")} 
                             editable={isEditable}
                             onUpdate={setMenuData}
                           />
                        </div>
                      </div>

                      {/* Slider Handle */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-indigo-500 z-20 cursor-ew-resize flex items-center justify-center"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg -ml-0.5">
                          <History className="h-4 w-4 text-white" />
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={sliderPosition} 
                          onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                        />
                      </div>

                      {/* Labels */}
                      <div className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest border border-white/10">Original</div>
                      <div className="absolute top-4 right-4 z-30 bg-indigo-600/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest border border-white/10">Optimiert</div>
                    </div>
                  ) : (
                    <MenuPreview 
                      data={menuData} 
                      theme={theme} 
                      className={containerStyle} 
                      editable={isEditable}
                      onUpdate={setMenuData}
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
      <footer className="relative z-10 py-12 text-center border-t border-white/5">
        <p className="text-zinc-600 text-sm font-light tracking-widest uppercase">
          &copy; 2026 Menü Magie &bull; Powered by Google Gemini
        </p>
      </footer>
    </div>
  );
}
